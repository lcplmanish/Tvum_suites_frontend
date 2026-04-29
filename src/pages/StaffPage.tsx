import React, { useEffect, useMemo, useState } from 'react';
import { useApp, StaffMember, RoomTask } from '@/context/AppContext';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { BadgeCheck, CheckCircle2, ClipboardList, Plus, Pencil, Sparkles, Target, Trash2, User, Users, Wrench } from 'lucide-react';
import { toast } from 'sonner';
import { canAccess } from '@/lib/permissions';
import { getRoleLabel, type AppRole } from '@/lib/permissions';
import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';
import { getRoomLabel } from '@/lib/utils';

type WorkStatus = 'assigned' | 'in-progress' | 'completed';

interface TaskAssignment {
  id: string;
  staffId: string;
  staffName: string;
  workType: string;
  roomNumber?: number;
  quantity: number;
  progress: number;
  status: WorkStatus;
  dueDate: string;
  notes: string;
  createdAt: string;
}

interface ProfileStaffMember {
  userId: string;
  name: string;
  role: string;
}

interface AssignmentTarget extends ProfileStaffMember {
  staffMemberId?: string;
}

const workTypeOptions = [
  'Room Cleaning',
  'Tea Refill',
  'Coffee Refill',
  'Bathroom Sanitizing',
  'Laundry Handover',
  'Inventory Check',
  'Guest Support',
];

const assignmentCapacity = 8;
const assignmentStorageKey = 'tvum.staff.assignments.v1';

type StaffAssignmentRow = Database['public']['Tables']['staff_assignments']['Row'];

const createAssignmentId = () => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }

  return `assignment-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
};

const readLocalAssignments = (): TaskAssignment[] => {
  if (typeof window === 'undefined') {
    return [];
  }

  try {
    const raw = window.localStorage.getItem(assignmentStorageKey);
    if (!raw) {
      return [];
    }

    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed as TaskAssignment[] : [];
  } catch {
    return [];
  }
};

const writeLocalAssignments = (assignments: TaskAssignment[]) => {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    window.localStorage.setItem(assignmentStorageKey, JSON.stringify(assignments));
  } catch {
    // ignore local storage write errors
  }
};

const isMissingAssignmentsTable = (error: { code?: string; message?: string } | null) => {
  if (!error) {
    return false;
  }

  const errorCode = (error.code || '').toUpperCase();
  if (errorCode === '42P01') {
    return true;
  }

  const message = (error.message || '').toLowerCase();
  return (
    message.includes('relation') &&
    message.includes('staff_assignments') &&
    message.includes('does not exist')
  );
};

const normalizeName = (value: string) => value.trim().toLowerCase();

const mapAssignmentRow = (row: StaffAssignmentRow): TaskAssignment => ({
  id: row.id,
  staffId: row.staff_member_id,
  staffName: row.staff_name_snapshot,
  workType: row.work_type,
  roomNumber: row.room_number ?? undefined,
  quantity: row.quantity,
  progress: row.progress,
  status: row.status as WorkStatus,
  dueDate: row.due_date ?? '',
  notes: row.notes ?? '',
  createdAt: row.created_at,
});

const accountRoles: Array<{ value: AppRole; label: string }> = [
  { value: 'staff', label: getRoleLabel('staff') },
  { value: 'supervisor', label: getRoleLabel('supervisor') },
  { value: 'main_supervisor', label: getRoleLabel('main_supervisor') },
  { value: 'accountant', label: getRoleLabel('accountant') },
  { value: 'admin', label: getRoleLabel('admin') },
  { value: 'owner', label: getRoleLabel('owner') },
];

const StaffPage = () => {
  const { staff, rooms, roomTasks, addStaff, updateStaff, deleteStaff, createUser, toggleRoomTask, setAllRoomTaskSubtasks, userRole, user } = useApp();
  const [showForm, setShowForm] = useState(false);
  const [showUserForm, setShowUserForm] = useState(false);
  const [editingStaff, setEditingStaff] = useState<StaffMember | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [assignments, setAssignments] = useState<TaskAssignment[]>([]);
  const [usingLocalFallback, setUsingLocalFallback] = useState(false);
  const [profileStaff, setProfileStaff] = useState<ProfileStaffMember[]>([]);
  const [currentProfile, setCurrentProfile] = useState<ProfileStaffMember | null>(null);

  const [formName, setFormName] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formRole, setFormRole] = useState('Housekeeper');
  const [newUserName, setNewUserName] = useState('');
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserPassword, setNewUserPassword] = useState('');
  const [newUserRole, setNewUserRole] = useState<AppRole>('staff');
  const [assignmentStaffId, setAssignmentStaffId] = useState('');
  const [assignmentRoom, setAssignmentRoom] = useState('all');
  const [assignmentType, setAssignmentType] = useState(workTypeOptions[0]);
  const [assignmentQuantity, setAssignmentQuantity] = useState('1');
  const [assignmentDueDate, setAssignmentDueDate] = useState('');
  const [assignmentNotes, setAssignmentNotes] = useState('');

  const assignmentTargets = useMemo<AssignmentTarget[]>(() => {
    return profileStaff.map(profile => {
      const matchedStaffMember = staff.find(member => normalizeName(member.name) === normalizeName(profile.name));
      return {
        ...profile,
        staffMemberId: matchedStaffMember?.id,
      };
    });
  }, [profileStaff, staff]);

  const assignmentTargetLookup = useMemo(() => new Map(assignmentTargets.map(target => [target.userId, target])), [assignmentTargets]);
  const isStaffView = userRole === 'staff';
  const currentStaffMember = useMemo(() => {
    if (!currentProfile) {
      return null;
    }

    return staff.find(member => normalizeName(member.name) === normalizeName(currentProfile.name)) || null;
  }, [currentProfile, staff]);

  const currentStaffAssignments = useMemo(() => {
    if (!currentProfile) {
      return [];
    }

    return assignments.filter(assignment => {
      if (currentStaffMember && assignment.staffId === currentStaffMember.id) {
        return true;
      }

      return normalizeName(assignment.staffName) === normalizeName(currentProfile.name);
    });
  }, [assignments, currentProfile, currentStaffMember]);

  const currentStaffRoomTasks = useMemo(() => {
    return roomTasks.map(roomTask => {
      const roomAssignments = currentStaffAssignments.filter(assignment => assignment.roomNumber === roomTask.roomNumber);
      const subtasks = Object.values(roomTask.tasks).flatMap(task => Object.values(task));
      const completedCount = subtasks.filter(Boolean).length;
      const totalCount = subtasks.length;
      const completion = totalCount ? Math.round((completedCount / totalCount) * 100) : 0;

      return {
        roomNumber: roomTask.roomNumber,
        completion,
        completedCount,
        totalCount,
        roomAssignments,
        tasks: roomTask.tasks,
      };
    });
  }, [currentStaffAssignments, roomTasks]);

  const roomProgress = useMemo(() => roomTasks.map(roomTask => {
    const subtasks = Object.values(roomTask.tasks).flatMap(task => Object.values(task));
    const completedCount = subtasks.filter(Boolean).length;
    const totalCount = subtasks.length;
    const completion = totalCount ? Math.round((completedCount / totalCount) * 100) : 0;
    return { roomNumber: roomTask.roomNumber, completedCount, totalCount, completion, allDone: completedCount === totalCount };
  }), [roomTasks]);

  const staffWorkload = useMemo(() => assignmentTargets.map(target => {
    const memberAssignments = assignments.filter(assignment => {
      if (target.staffMemberId && assignment.staffId === target.staffMemberId) {
        return true;
      }
      return normalizeName(assignment.staffName) === normalizeName(target.name);
    });
    const assignedCount = memberAssignments.filter(assignment => assignment.status !== 'completed').length;
    const completedCount = memberAssignments.filter(assignment => assignment.status === 'completed').length;
    const loadUnits = memberAssignments.reduce((sum, assignment) => sum + assignment.quantity, 0);

    return {
      id: target.userId,
      name: target.name,
      role: target.role,
      staffMemberId: target.staffMemberId,
      assignedCount,
      completedCount,
      loadUnits,
      capacity: assignmentCapacity,
      assignments: memberAssignments,
    };
  }), [assignments, assignmentTargets]);

  const activeAssignments = useMemo(
    () => assignments.filter(assignment => assignment.status !== 'completed').sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    [assignments]
  );

  const totalOpenChecklistItems = useMemo(() => roomTasks.reduce((sum, roomTask) => {
    const subtasks = Object.values(roomTask.tasks).flatMap(task => Object.values(task));
    return sum + subtasks.filter(completed => !completed).length;
  }, 0), [roomTasks]);

  const completedAssignments = assignments.filter(assignment => assignment.status === 'completed').length;
  const activeAssignmentCount = activeAssignments.length;
  const fullyCompletedRooms = roomProgress.filter(room => room.allDone).length;
  const staffedMembersWithWork = staffWorkload.filter(member => member.assignedCount > 0).length;
  const canManageStaff = canAccess(userRole, 'manage_staff');
  const myOpenAssignments = currentStaffAssignments.filter(assignment => assignment.status !== 'completed');

  const renderChecklistItem = (
    roomNumber: number,
    task: keyof RoomTask['tasks'],
    subtask: string,
    checked: boolean,
    label: string,
  ) => (
    <label className="flex items-center gap-2 text-xs text-muted-foreground" key={`${task}-${subtask}`}>
      <Checkbox checked={checked} onCheckedChange={() => toggleRoomTask(roomNumber, task, subtask)} />
      <span>{label}</span>
    </label>
  );

  const renderChecklistSection = (
    roomNumber: number,
    title: string,
    task: keyof RoomTask['tasks'],
    items: Array<{ key: string; label: string; checked: boolean }>,
  ) => {
    const allChecked = items.every(item => item.checked);

    return (
      <div>
        <div className="mb-1 flex items-center justify-between gap-2">
          <p className="font-medium text-foreground">{title}</p>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-6 px-2 text-[11px]"
            onClick={() => setAllRoomTaskSubtasks(roomNumber, task, !allChecked)}
          >
            {allChecked ? 'Clear all' : 'Select all'}
          </Button>
        </div>
        <div className="space-y-1.5 text-muted-foreground">
          {items.map(item => renderChecklistItem(roomNumber, task, item.key, item.checked, item.label))}
        </div>
      </div>
    );
  };

  const openCreate = () => {
    setEditingStaff(null);
    setFormName('');
    setFormPhone('');
    setFormRole('Housekeeper');
    setShowForm(true);
  };

  const openEdit = (member: StaffMember) => {
    setEditingStaff(member);
    setFormName(member.name);
    setFormPhone(member.contact);
    setFormRole(member.role);
    setShowForm(true);
  };

  const handleSave = () => {
    if (!formName.trim() || !formPhone.trim()) {
      toast.error('Name and phone are required');
      return;
    }

    if (editingStaff) {
      updateStaff(editingStaff.id, { name: formName, contact: formPhone, role: formRole });
      toast.success('Staff member updated');
    } else {
      addStaff({ name: formName, contact: formPhone, role: formRole });
      toast.success('Staff member added');
    }

    setShowForm(false);
  };

  const handleDelete = () => {
    if (!deleteId) return;
    deleteStaff(deleteId);
    toast.success('Staff member deleted');
    setDeleteId(null);
  };

  const resetAssignmentForm = () => {
    setAssignmentStaffId('');
    setAssignmentRoom('all');
    setAssignmentType(workTypeOptions[0]);
    setAssignmentQuantity('1');
    setAssignmentDueDate('');
    setAssignmentNotes('');
  };

  const handleAssignWork = async () => {
    const selectedProfileStaff = assignmentTargetLookup.get(assignmentStaffId);
    const quantity = Number(assignmentQuantity);

    if (!selectedProfileStaff) {
      toast.error('Select a staff member to assign work');
      return;
    }

    let resolvedStaffMemberId = selectedProfileStaff.staffMemberId;

    if (!resolvedStaffMemberId && usingLocalFallback) {
      // Local fallback has no DB FK requirements, so use profile user id as a stable local key.
      resolvedStaffMemberId = selectedProfileStaff.userId;
    }

    if (!resolvedStaffMemberId) {
      const { data: createdStaff, error: createStaffError } = await supabase
        .from('staff_members')
        .insert({
          name: selectedProfileStaff.name,
          role: 'Staff',
          contact: '',
        })
        .select('id')
        .single();

      if (createStaffError || !createdStaff) {
        toast.error('Could not link selected profile to staff directory. Please add staff record first.');
        return;
      }

      resolvedStaffMemberId = createdStaff.id;
    }

    if (!Number.isFinite(quantity) || quantity < 1) {
      toast.error('Task count must be at least 1');
      return;
    }

    const localAssignment: TaskAssignment = {
      id: createAssignmentId(),
      staffId: resolvedStaffMemberId,
      staffName: selectedProfileStaff.name,
      workType: assignmentType,
      roomNumber: assignmentRoom === 'all' ? undefined : Number(assignmentRoom),
      quantity,
      progress: 0,
      status: 'assigned',
      dueDate: assignmentDueDate,
      notes: assignmentNotes.trim(),
      createdAt: new Date().toISOString(),
    };

    if (usingLocalFallback) {
      setAssignments(prev => {
        const next = [localAssignment, ...prev];
        writeLocalAssignments(next);
        return next;
      });
      toast.success(`Assigned ${assignmentType.toLowerCase()} to ${selectedProfileStaff.name}`);
      resetAssignmentForm();
      return;
    }

    const payload: Database['public']['Tables']['staff_assignments']['Insert'] = {
      staff_member_id: resolvedStaffMemberId,
      staff_name_snapshot: selectedProfileStaff.name,
      work_type: assignmentType,
      room_number: assignmentRoom === 'all' ? null : Number(assignmentRoom),
      quantity,
      progress: 0,
      status: 'assigned',
      due_date: assignmentDueDate || null,
      notes: assignmentNotes.trim() || null,
      assigned_by: user?.id,
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from('staff_assignments')
      .insert(payload)
      .select('*')
      .single();

    if (error || !data) {
      if (isMissingAssignmentsTable(error)) {
        setUsingLocalFallback(true);
        setAssignments(prev => {
          const next = [localAssignment, ...prev];
          writeLocalAssignments(next);
          return next;
        });
        toast.warning('Backend assignments table is missing. Using local device storage for now.');
        resetAssignmentForm();
        return;
      }

      console.error('Failed to assign task', error);
      toast.error('Could not assign task. Please try again.');
      return;
    }

    const nextAssignment = mapAssignmentRow(data);
    setAssignments(prev => [nextAssignment, ...prev]);
    toast.success(`Assigned ${assignmentType.toLowerCase()} to ${selectedProfileStaff.name}`);
    resetAssignmentForm();
  };

  const updateAssignment = (id: string, updater: (assignment: TaskAssignment) => TaskAssignment) => {
    setAssignments(prev => prev.map(assignment => assignment.id === id ? updater(assignment) : assignment));
  };

  const markAssignmentProgress = async (id: string, delta: number) => {
    const assignment = assignments.find(item => item.id === id);
    if (!assignment) {
      return;
    }

    const nextProgress = Math.min(assignment.quantity, assignment.progress + delta);
    const nextStatus: WorkStatus = nextProgress >= assignment.quantity ? 'completed' : 'in-progress';

    if (usingLocalFallback) {
      setAssignments(prev => {
        const next = prev.map(item => item.id === id ? ({ ...item, progress: nextProgress, status: nextStatus } as TaskAssignment) : item);
        writeLocalAssignments(next);
        return next;
      });
      return;
    }

    const { data, error } = await supabase
      .from('staff_assignments')
      .update({
        progress: nextProgress,
        status: nextStatus,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select('*')
      .maybeSingle();

    if (error || !data) {
      if (isMissingAssignmentsTable(error)) {
        setUsingLocalFallback(true);
        setAssignments(prev => {
          const next = prev.map(item => item.id === id ? { ...item, progress: nextProgress, status: nextStatus } : item);
          writeLocalAssignments(next);
          return next;
        });
        toast.warning('Backend assignments table is missing. Using local device storage for now.');
        return;
      }

      console.error('Failed to update assignment progress', error);
      toast.error('Could not update task progress');
      return;
    }

    if (!data) {
      toast.error('You can only update tasks assigned to you.');
      return;
    }

    const next = mapAssignmentRow(data);
    updateAssignment(id, () => next);
  };

  const markAssignmentComplete = async (id: string) => {
    const assignment = assignments.find(item => item.id === id);
    if (!assignment) {
      return;
    }

    if (usingLocalFallback) {
      setAssignments(prev => {
        const next = prev.map(item => item.id === id ? ({ ...item, progress: assignment.quantity, status: 'completed' as WorkStatus } as TaskAssignment) : item);
        writeLocalAssignments(next);
        return next;
      });
      return;
    }

    const { data, error } = await supabase
      .from('staff_assignments')
      .update({
        progress: assignment.quantity,
        status: 'completed',
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select('*')
      .maybeSingle();

    if (error || !data) {
      if (isMissingAssignmentsTable(error)) {
        setUsingLocalFallback(true);
        setAssignments(prev => {
          const next = prev.map(item => item.id === id ? ({ ...item, progress: assignment.quantity, status: 'completed' as WorkStatus } as TaskAssignment) : item);
          writeLocalAssignments(next);
          return next;
        });
        toast.warning('Backend assignments table is missing. Using local device storage for now.');
        return;
      }

      console.error('Failed to complete assignment', error);
      toast.error('Could not complete task');
      return;
    }

    if (!data) {
      toast.error('You can only complete tasks assigned to you.');
      return;
    }

    const next = mapAssignmentRow(data);
    updateAssignment(id, () => next);
  };

  const removeAssignment = async (id: string) => {
    if (usingLocalFallback) {
      setAssignments(prev => {
        const next = prev.filter(assignment => assignment.id !== id);
        writeLocalAssignments(next);
        return next;
      });
      toast.success('Task removed');
      return;
    }

    const { error } = await supabase.from('staff_assignments').delete().eq('id', id);
    if (error) {
      if (isMissingAssignmentsTable(error)) {
        setUsingLocalFallback(true);
        setAssignments(prev => {
          const next = prev.filter(assignment => assignment.id !== id);
          writeLocalAssignments(next);
          return next;
        });
        toast.warning('Backend assignments table is missing. Using local device storage for now.');
        return;
      }

      console.error('Failed to delete assignment', error);
      toast.error('Could not remove task');
      return;
    }

    setAssignments(prev => prev.filter(assignment => assignment.id !== id));
    toast.success('Task removed');
  };

  const todayLabel = new Date().toLocaleDateString(undefined, { month: 'short', day: 'numeric' });

  useEffect(() => {
    if (!user) {
      setAssignments([]);
      return;
    }

    const loadAssignments = async () => {
      const { data, error } = await supabase
        .from('staff_assignments')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        if (isMissingAssignmentsTable(error)) {
          setUsingLocalFallback(true);
          setAssignments(readLocalAssignments());
          toast.warning('staff_assignments table is missing in connected Supabase project. Using local device storage.');
          return;
        }

        console.error('Failed to load staff assignments', error);
        toast.error('Could not load assignments from server. Check table grants/policies.');
        return;
      }

      setUsingLocalFallback(false);
      setAssignments((data || []).map(mapAssignmentRow));
    };

    loadAssignments();
  }, [user]);

  useEffect(() => {
    if (!user) {
      setProfileStaff([]);
      setCurrentProfile(null);
      return;
    }

    const loadProfileStaff = async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('user_id,name,role')
        .eq('role', 'staff')
        .order('name', { ascending: true });

      if (error) {
        console.error('Failed to load staff profiles', error);
        toast.error('Could not load staff profiles');
        return;
      }

      setProfileStaff((data || []).map(item => ({
        userId: item.user_id,
        name: item.name,
        role: item.role,
      })));
    };

    loadProfileStaff();
  }, [user]);

  useEffect(() => {
    if (!user) {
      setCurrentProfile(null);
      return;
    }

    const loadCurrentProfile = async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('user_id,name,role')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error || !data) {
        console.error('Failed to load current profile', error);
        setCurrentProfile(null);
        return;
      }

      setCurrentProfile({
        userId: data.user_id,
        name: data.name,
        role: data.role,
      });
    };

    loadCurrentProfile();
  }, [user]);

  if (isStaffView) {
    return (
      <div className="max-w-7xl mx-auto slide-up space-y-8">
        <section className="rounded-3xl border border-border bg-gradient-to-br from-card via-card to-secondary/30 p-6 md:p-8 shadow-[var(--shadow-card)]">
          <div className="max-w-3xl">
            <p className="text-xs uppercase tracking-[0.35em] text-muted-foreground">Staff work desk</p>
            <h1 className="mt-2 text-3xl font-serif font-semibold text-foreground md:text-4xl">Room-wise work and supervisor tasks</h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground md:text-base">
              See the room checklist progress and the tasks your supervisor assigned to you.
            </p>
          </div>
        </section>

        <div className="space-y-6">
          <section className="rounded-2xl border border-border bg-card p-6 shadow-[var(--shadow-card)]">
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <h2 className="text-xl font-serif font-semibold text-foreground">My assigned tasks</h2>
                <p className="mt-1 text-sm text-muted-foreground">Tasks assigned by your supervisor.</p>
              </div>
              <Badge variant="secondary" className="gap-1">
                <Users className="h-3.5 w-3.5" /> {myOpenAssignments.length} open
              </Badge>
            </div>

            {currentStaffAssignments.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-border/70 bg-background/60 p-6 text-center text-sm text-muted-foreground">
                No tasks assigned yet.
              </div>
            ) : (
              <div className="space-y-4">
                {currentStaffAssignments.map(assignment => {
                  const completedPercentage = Math.round((assignment.progress / assignment.quantity) * 100);
                  const roomLabel = getRoomLabel(rooms, assignment.roomNumber);

                  return (
                    <div key={assignment.id} className="rounded-2xl border border-border/70 bg-background/70 p-4">
                      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="font-medium text-foreground">{assignment.workType}</h3>
                            <Badge variant="outline">{assignment.status.replace('-', ' ')}</Badge>
                          </div>
                          <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                            <span>{roomLabel}</span>
                            <span>•</span>
                            <span>{assignment.quantity} unit{assignment.quantity > 1 ? 's' : ''}</span>
                            {assignment.dueDate && (
                              <>
                                <span>•</span>
                                <span>Due {assignment.dueDate}</span>
                              </>
                            )}
                          </div>
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                          <Button variant="outline" size="sm" onClick={() => markAssignmentProgress(assignment.id, 1)} className="gap-2">
                            <CheckCircle2 className="h-3.5 w-3.5" /> Add progress
                          </Button>
                          <Button variant="outline" size="sm" onClick={() => markAssignmentComplete(assignment.id)} className="gap-2">
                            <BadgeCheck className="h-3.5 w-3.5" /> Complete
                          </Button>
                        </div>
                      </div>
                      <div className="mt-4 space-y-2">
                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                          <span>{assignment.progress}/{assignment.quantity} completed</span>
                          <span>{completedPercentage}%</span>
                        </div>
                        <Progress value={completedPercentage} />
                      </div>
                      {assignment.notes && <p className="mt-3 text-sm text-muted-foreground">{assignment.notes}</p>}
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          <section className="rounded-2xl border border-border bg-card p-6 shadow-[var(--shadow-card)]">
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <h2 className="text-xl font-serif font-semibold text-foreground">Room Tasks</h2>
                <p className="mt-1 text-sm text-muted-foreground">Track checklist progress room by room and see which supervisor tasks are linked to each room.</p>
              </div>
              <Badge variant="outline">Updated {todayLabel}</Badge>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              {currentStaffRoomTasks.map(room => (
                <div key={room.roomNumber} className="rounded-2xl border border-border/70 bg-background/70 p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h3 className="font-semibold text-foreground">{getRoomLabel(rooms, room.roomNumber)}</h3>
                      <p className="text-xs text-muted-foreground">{room.completedCount}/{room.totalCount} checklist items done</p>
                    </div>
                    <Badge variant={room.completion >= 100 ? 'outline' : 'secondary'} className="text-xs">
                      {room.completion >= 100 ? 'Done' : 'In progress'}
                    </Badge>
                  </div>

                  <div className="mt-4 space-y-3 rounded-xl border border-border/60 bg-card/50 p-3 text-xs">
                    {renderChecklistSection(room.roomNumber, 'Room Clean', 'roomCleaned', [
                      { key: 'mopping', label: 'Mopping', checked: room.tasks.roomCleaned.mopping },
                      { key: 'vacuuming', label: 'Vacuuming', checked: room.tasks.roomCleaned.vacuuming },
                      { key: 'dusting', label: 'Dusting', checked: room.tasks.roomCleaned.dusting },
                    ])}
                    {renderChecklistSection(room.roomNumber, 'Tea Bag Refill', 'teaBagsRefilled', [
                      { key: 'restocked', label: 'Restocked', checked: room.tasks.teaBagsRefilled.restocked },
                      { key: 'checked', label: 'Checked', checked: room.tasks.teaBagsRefilled.checked },
                    ])}
                    {renderChecklistSection(room.roomNumber, 'Coffee Refill', 'coffeeRefilled', [
                      { key: 'restocked', label: 'Restocked', checked: room.tasks.coffeeRefilled.restocked },
                      { key: 'checked', label: 'Checked', checked: room.tasks.coffeeRefilled.checked },
                    ])}
                    {renderChecklistSection(room.roomNumber, 'Bathroom Cleaned', 'bathroomCleaned', [
                      { key: 'mopping', label: 'Mopping', checked: room.tasks.bathroomCleaned.mopping },
                      { key: 'wiping', label: 'Wiping', checked: room.tasks.bathroomCleaned.wiping },
                      { key: 'sanitizing', label: 'Sanitizing', checked: room.tasks.bathroomCleaned.sanitizing },
                    ])}
                  </div>

                  <div className="mt-4 space-y-2">
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>Completion</span>
                      <span>{room.completion}%</span>
                    </div>
                    <Progress value={room.completion} />
                  </div>

                  {room.roomAssignments.length > 0 ? (
                    <div className="mt-4 flex flex-wrap gap-2">
                      {room.roomAssignments.map(assignment => (
                        <Badge key={assignment.id} variant="outline" className="text-[11px]">
                          {assignment.workType}
                        </Badge>
                      ))}
                    </div>
                  ) : (
                    <p className="mt-4 text-xs text-muted-foreground">No direct assignment linked yet.</p>
                  )}
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto slide-up space-y-8">
      <section className="rounded-3xl border border-border bg-gradient-to-br from-card via-card to-secondary/30 p-6 md:p-8 shadow-[var(--shadow-card)]">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <p className="text-xs uppercase tracking-[0.35em] text-muted-foreground">{userRole === 'supervisor' ? 'Supervisor work desk' : 'Task and staff control'}</p>
            <h1 className="mt-2 text-3xl font-serif font-semibold text-foreground md:text-4xl">
              {userRole === 'supervisor' ? 'Assign work, track completion, and balance the load.' : 'Staff operations and room work overview.'}
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground md:text-base">
              Use this page to assign room and service work, see who is handling each job, and keep a live view of room checklist progress.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            {canAccess(userRole, 'manage_roles') && (
              <Button variant="secondary" onClick={() => setShowUserForm(true)} className="gap-2">
                <Plus className="w-4 h-4" /> Create App User
              </Button>
            )}
            {(userRole === 'admin' || userRole === 'owner') && (
              <Button onClick={openCreate} className="gap-2">
                <Plus className="w-4 h-4" /> Add Staff
              </Button>
            )}
          </div>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-2xl border border-border/60 bg-background/70 p-4">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Open checklist items</p>
            <div className="mt-3 flex items-end justify-between gap-3">
              <div className="text-3xl font-semibold text-foreground">{totalOpenChecklistItems}</div>
              <ClipboardList className="h-5 w-5 text-primary" />
            </div>
          </div>
          <div className="rounded-2xl border border-border/60 bg-background/70 p-4">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Active assignments</p>
            <div className="mt-3 flex items-end justify-between gap-3">
              <div className="text-3xl font-semibold text-foreground">{activeAssignmentCount}</div>
              <Wrench className="h-5 w-5 text-primary" />
            </div>
          </div>
          <div className="rounded-2xl border border-border/60 bg-background/70 p-4">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Completed work</p>
            <div className="mt-3 flex items-end justify-between gap-3">
              <div className="text-3xl font-semibold text-foreground">{completedAssignments}</div>
              <BadgeCheck className="h-5 w-5 text-success" />
            </div>
          </div>
          <div className="rounded-2xl border border-border/60 bg-background/70 p-4">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Rooms cleared</p>
            <div className="mt-3 flex items-end justify-between gap-3">
              <div className="text-3xl font-semibold text-foreground">{fullyCompletedRooms}/{roomTasks.length}</div>
              <Target className="h-5 w-5 text-primary" />
            </div>
          </div>
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <div className="space-y-6">
          {canManageStaff && (
            <section className="rounded-2xl border border-border bg-card p-6 shadow-[var(--shadow-card)]">
              <div className="mb-5 flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-xl font-serif font-semibold text-foreground">Assign new work</h2>
                  <p className="mt-1 text-sm text-muted-foreground">Set the job, room, quantity, and due date for a staff member.</p>
                </div>
                <Sparkles className="mt-1 h-5 w-5 text-primary" />
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Staff member</Label>
                  <Select value={assignmentStaffId} onValueChange={setAssignmentStaffId}>
                    <SelectTrigger><SelectValue placeholder="Select a staff member" /></SelectTrigger>
                    <SelectContent>
                      {assignmentTargets.map(member => (
                        <SelectItem key={member.userId} value={member.userId}>{member.name} - {member.role}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Room</Label>
                  <Select value={assignmentRoom} onValueChange={setAssignmentRoom}>
                    <SelectTrigger><SelectValue placeholder="Assign to a room" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">General / No room</SelectItem>
                      {roomTasks.map(room => (
                        <SelectItem key={room.roomNumber} value={String(room.roomNumber)}>{getRoomLabel(rooms, room.roomNumber)}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Work type</Label>
                  <Select value={assignmentType} onValueChange={setAssignmentType}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {workTypeOptions.map(option => (
                        <SelectItem key={option} value={option}>{option}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Task count</Label>
                  <Input type="number" min="1" value={assignmentQuantity} onChange={e => setAssignmentQuantity(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Due date</Label>
                  <Input type="date" value={assignmentDueDate} onChange={e => setAssignmentDueDate(e.target.value)} />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label>Notes</Label>
                  <Textarea value={assignmentNotes} onChange={e => setAssignmentNotes(e.target.value)} placeholder="Add instructions, priorities, or guest notes" />
                </div>
              </div>
              <div className="mt-5 flex justify-end">
                <Button onClick={handleAssignWork} className="gap-2">
                  <Plus className="h-4 w-4" /> Assign task
                </Button>
              </div>
            </section>
          )}

          <section className="rounded-2xl border border-border bg-card p-6 shadow-[var(--shadow-card)]">
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <h2 className="text-xl font-serif font-semibold text-foreground">Active assignments</h2>
                <p className="mt-1 text-sm text-muted-foreground">Track who is doing what, how much is left, and what is due next.</p>
              </div>
              <Badge variant="secondary" className="h-fit gap-1">
                <Users className="h-3.5 w-3.5" /> {activeAssignmentCount} open
              </Badge>
            </div>

            {activeAssignments.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-border/70 bg-background/60 p-6 text-center text-sm text-muted-foreground">
                No assignments yet. Use the form above to send work to the team.
              </div>
            ) : (
              <div className="space-y-4">
                {activeAssignments.map(assignment => {
                  const completedPercentage = Math.round((assignment.progress / assignment.quantity) * 100);
                  const roomLabel = getRoomLabel(rooms, assignment.roomNumber);
                  const statusStyles: Record<WorkStatus, string> = {
                    assigned: 'bg-secondary text-foreground',
                    'in-progress': 'bg-amber-100 text-amber-800 border-amber-200',
                    completed: 'bg-success/10 text-success border-success/20',
                  };

                  return (
                    <div key={assignment.id} className="rounded-2xl border border-border/70 bg-background/70 p-4">
                      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="font-medium text-foreground">{assignment.workType}</h3>
                            <Badge variant="outline" className={statusStyles[assignment.status]}>{assignment.status.replace('-', ' ')}</Badge>
                          </div>
                          <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                            <span>{assignment.staffName}</span>
                            <span>•</span>
                            <span>{roomLabel}</span>
                            <span>•</span>
                            <span>{assignment.quantity} unit{assignment.quantity > 1 ? 's' : ''}</span>
                            {assignment.dueDate && (
                              <>
                                <span>•</span>
                                <span>Due {assignment.dueDate}</span>
                              </>
                            )}
                          </div>
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                          <Button variant="outline" size="sm" onClick={() => markAssignmentProgress(assignment.id, 1)} className="gap-2">
                            <CheckCircle2 className="h-3.5 w-3.5" /> Add progress
                          </Button>
                          <Button variant="outline" size="sm" onClick={() => markAssignmentComplete(assignment.id)} className="gap-2">
                            <BadgeCheck className="h-3.5 w-3.5" /> Complete
                          </Button>
                          <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive" onClick={() => removeAssignment(assignment.id)}>
                            Remove
                          </Button>
                        </div>
                      </div>
                      <div className="mt-4 space-y-2">
                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                          <span>{assignment.progress}/{assignment.quantity} completed</span>
                          <span>{completedPercentage}%</span>
                        </div>
                        <Progress value={completedPercentage} />
                      </div>
                      {assignment.notes && (
                        <p className="mt-3 text-sm text-muted-foreground">{assignment.notes}</p>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        </div>

        <div className="space-y-6">
          <section className="rounded-2xl border border-border bg-card p-6 shadow-[var(--shadow-card)]">
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <h2 className="text-xl font-serif font-semibold text-foreground">Staff workload</h2>
                <p className="mt-1 text-sm text-muted-foreground">See who has work, who is near capacity, and who is free to take more.</p>
              </div>
              <Badge variant="outline" className="gap-1">
                <Users className="h-3.5 w-3.5" /> {staffedMembersWithWork}/{assignmentTargets.length} busy
              </Badge>
            </div>

            <div className="space-y-4">
              {staffWorkload.map(member => {
                const loadPercent = Math.min(100, Math.round((member.loadUnits / member.capacity) * 100));
                return (
                  <div key={member.id} className="rounded-2xl border border-border/70 bg-background/70 p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-secondary text-primary">
                            <User className="h-4 w-4" />
                          </div>
                          <div>
                            <p className="font-medium text-foreground">{member.name}</p>
                            <p className="text-xs text-muted-foreground">{member.role}</p>
                          </div>
                        </div>
                      </div>
                      <Badge variant={member.assignedCount ? 'secondary' : 'outline'} className="text-xs">
                        {member.assignedCount ? `${member.assignedCount} open` : 'Available'}
                      </Badge>
                    </div>
                    <div className="mt-4 grid grid-cols-3 gap-3 text-center text-xs">
                      <div className="rounded-xl bg-secondary/50 p-2">
                        <div className="text-muted-foreground">Assigned</div>
                        <div className="mt-1 font-semibold text-foreground">{member.assignedCount}</div>
                      </div>
                      <div className="rounded-xl bg-secondary/50 p-2">
                        <div className="text-muted-foreground">Done</div>
                        <div className="mt-1 font-semibold text-foreground">{member.completedCount}</div>
                      </div>
                      <div className="rounded-xl bg-secondary/50 p-2">
                        <div className="text-muted-foreground">Load</div>
                        <div className="mt-1 font-semibold text-foreground">{member.loadUnits}/{member.capacity}</div>
                      </div>
                    </div>
                    <div className="mt-4 space-y-2">
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>Capacity</span>
                        <span>{loadPercent}%</span>
                      </div>
                      <Progress value={loadPercent} />
                    </div>
                    {member.assignments.length > 0 ? (
                      <div className="mt-4 flex flex-wrap gap-2">
                        {member.assignments.slice(0, 3).map(assignment => (
                          <Badge key={assignment.id} variant="outline" className="text-[11px]">
                            {assignment.workType}{assignment.roomNumber ? ` • ${getRoomLabel(rooms, assignment.roomNumber)}` : ''}
                          </Badge>
                        ))}
                        {member.assignments.length > 3 && (
                          <Badge variant="secondary" className="text-[11px]">+{member.assignments.length - 3} more</Badge>
                        )}
                      </div>
                    ) : (
                      <p className="mt-4 text-xs text-muted-foreground">No work assigned yet.</p>
                    )}
                  </div>
                );
              })}
            </div>
          </section>

          <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
            {canManageStaff && (
              <section className="rounded-2xl border border-border bg-card p-6 shadow-[var(--shadow-card)]">
                <div className="mb-5 flex items-center justify-between gap-4">
                  <div>
                    <h2 className="text-xl font-serif font-semibold text-foreground">Staff directory</h2>
                    <p className="mt-1 text-sm text-muted-foreground">Manage team records for assignment and contact.</p>
                  </div>
                  <Badge variant="secondary" className="gap-1">
                    <Users className="h-3.5 w-3.5" /> {staff.length} members
                  </Badge>
                </div>

                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Phone</TableHead>
                        <TableHead>Role</TableHead>
                        <TableHead>Load</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {staff.map(s => {
                        const memberLoad = staffWorkload.find(member => (
                          member.staffMemberId === s.id || normalizeName(member.name) === normalizeName(s.name)
                        ));
                        return (
                          <TableRow key={s.id}>
                            <TableCell className="font-medium flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center">
                                <User className="w-4 h-4 text-primary" />
                              </div>
                              {s.name}
                            </TableCell>
                            <TableCell className="text-sm">{s.contact}</TableCell>
                            <TableCell>
                              <Badge variant="secondary" className="text-xs">{s.role}</Badge>
                            </TableCell>
                            <TableCell className="text-sm text-muted-foreground">
                              {memberLoad ? `${memberLoad.assignedCount} open / ${memberLoad.completedCount} done` : 'No work yet'}
                            </TableCell>
                            <TableCell className="text-right">
                              <Button variant="ghost" size="sm" className="h-7 text-xs gap-1 mr-1" onClick={() => openEdit(s)}>
                                <Pencil className="w-3.5 h-3.5" /> Edit
                              </Button>
                              {canAccess(userRole, 'delete_staff') && (
                                <Button variant="ghost" size="sm" className="h-7 text-xs gap-1 text-destructive hover:text-destructive" onClick={() => setDeleteId(s.id)}>
                                  <Trash2 className="w-3.5 h-3.5" /> Delete
                                </Button>
                              )}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              </section>
            )}

            <section className="rounded-2xl border border-border bg-card p-6 shadow-[var(--shadow-card)]">
              <div className="mb-5 flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-xl font-serif font-semibold text-foreground">Room progress</h2>
                  <p className="mt-1 text-sm text-muted-foreground">Checklist status for the housekeeping and maintenance rounds.</p>
                </div>
                <Badge variant="outline">Updated {todayLabel}</Badge>
              </div>

              <div className="space-y-4">
                {roomProgress.map(room => {
                  const relatedAssignments = assignments.filter(assignment => assignment.roomNumber === room.roomNumber);
                  return (
                    <div key={room.roomNumber} className="rounded-2xl border border-border/70 bg-background/70 p-4">
                      <div className="flex items-center justify-between gap-4">
                        <div>
                          <h3 className="font-medium text-foreground">{getRoomLabel(rooms, room.roomNumber)}</h3>
                          <p className="text-xs text-muted-foreground">{room.completedCount}/{room.totalCount} checklist items done</p>
                        </div>
                        {room.allDone ? (
                          <Badge variant="outline" className="bg-success/10 text-success border-success/20 text-xs">
                            <CheckCircle2 className="mr-1 h-3 w-3" /> Completed
                          </Badge>
                        ) : (
                          <Badge variant="secondary" className="text-xs">In progress</Badge>
                        )}
                      </div>
                      <div className="mt-4 space-y-2">
                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                          <span>Completion</span>
                          <span>{room.completion}%</span>
                        </div>
                        <Progress value={room.completion} />
                      </div>
                      <div className="mt-4 flex flex-wrap gap-2">
                        {relatedAssignments.length > 0 ? (
                          relatedAssignments.map(assignment => (
                            <Badge key={assignment.id} variant="outline" className="text-[11px]">
                              {assignment.staffName} · {assignment.workType}
                            </Badge>
                          ))
                        ) : (
                          <span className="text-xs text-muted-foreground">No direct assignment linked yet.</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          </div>
        </div>
      </div>

      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingStaff ? 'Edit Staff Member' : 'Add Staff Member'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label>Name *</Label>
              <Input value={formName} onChange={e => setFormName(e.target.value)} placeholder="Full name" />
            </div>
            <div>
              <Label>Phone *</Label>
              <Input value={formPhone} onChange={e => setFormPhone(e.target.value)} placeholder="+91 9876543210" />
            </div>
            <div>
              <Label>Role</Label>
              <Select value={formRole} onValueChange={setFormRole}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Housekeeper">Housekeeper</SelectItem>
                  <SelectItem value="Maintenance">Maintenance</SelectItem>
                  <SelectItem value="Front Desk">Front Desk</SelectItem>
                  <SelectItem value="Supervisor">Supervisor</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
            <Button onClick={handleSave}>{editingStaff ? 'Update' : 'Add'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showUserForm} onOpenChange={setShowUserForm}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Create App User</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label>Name *</Label>
              <Input value={newUserName} onChange={e => setNewUserName(e.target.value)} placeholder="Full name" />
            </div>
            <div>
              <Label>Email *</Label>
              <Input value={newUserEmail} onChange={e => setNewUserEmail(e.target.value)} placeholder="user@example.com" type="email" />
            </div>
            <div>
              <Label>Password *</Label>
              <Input value={newUserPassword} onChange={e => setNewUserPassword(e.target.value)} placeholder="Create a password" type="password" />
            </div>
            <div>
              <Label>Role *</Label>
              <Select value={newUserRole} onValueChange={value => setNewUserRole(value as AppRole)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {accountRoles.map(role => (
                    <SelectItem key={role.value} value={role.value}>{role.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowUserForm(false)}>Cancel</Button>
            <Button onClick={async () => {
              if (!newUserName.trim() || !newUserEmail || !newUserPassword) {
                toast.error('Name, email, and password are required');
                return;
              }

              const { error } = await createUser({
                name: newUserName.trim(),
                email: newUserEmail,
                password: newUserPassword,
                role: newUserRole,
              });

              if (error) {
                toast.error(error);
                return;
              }

              toast.success('App User created successfully! They can log in immediately with their email and password.');
              setNewUserName('');
              setNewUserEmail('');
              setNewUserPassword('');
              setNewUserRole('staff');
              setShowUserForm(false);
            }}>Create User</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Staff Member</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this staff member? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default StaffPage;
