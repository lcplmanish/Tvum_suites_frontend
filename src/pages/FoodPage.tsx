import React, { useEffect, useMemo, useState } from 'react';
import { format } from 'date-fns';
import { Coffee, Lock, Minus, Plus, Printer, ReceiptText, Users, UtensilsCrossed } from 'lucide-react';
import { toast } from 'sonner';

import logoImage from '@/assets/image.png';
import { useApp, type FoodBill } from '@/context/AppContext';
import { canAccess } from '@/lib/permissions';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

const currency = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 0,
});

const getTodayDateString = () => {
  const now = new Date();
  return [now.getFullYear(), now.getMonth() + 1, now.getDate()]
    .map((part) => String(part).padStart(2, '0'))
    .join('-');
};

const FoodPage = () => {
  const { bookings, foodBills, updateBooking, updateFoodPricing, saveFoodBill, foodPricing, userRole } = useApp();
  const canEditPrices = canAccess(userRole, 'edit_food_prices');
  const activeBookings = useMemo(
    () => bookings.filter(booking => booking.status !== 'cancelled').sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()),
    [bookings]
  );
  const [selectedBookingId, setSelectedBookingId] = useState<string>('');
  const [breakfastCount, setBreakfastCount] = useState(0);
  const [lunchCount, setLunchCount] = useState(0);
  const [teaCoffeeCount, setTeaCoffeeCount] = useState(0);
  const [orderDate, setOrderDate] = useState(getTodayDateString());
  const [breakfastPrice, setBreakfastPrice] = useState(foodPricing.breakfastPrice);
  const [lunchPrice, setLunchPrice] = useState(foodPricing.lunchPrice);
  const [teaCoffeePrice, setTeaCoffeePrice] = useState(foodPricing.teaCoffeePrice);
  const [previewGuestKey, setPreviewGuestKey] = useState<string | null>(null);
  const [isGstEnabled, setIsGstEnabled] = useState(true);
  const [isDiscountEnabled, setIsDiscountEnabled] = useState(false);
  const [discountPercent, setDiscountPercent] = useState(20);
  const [lastSavedBookingId, setLastSavedBookingId] = useState<string>('');
  const [logoBase64, setLogoBase64] = useState<string>('');

  const selectedBooking = useMemo(
    () => activeBookings.find(booking => booking.id === selectedBookingId) ?? null,
    [activeBookings, selectedBookingId]
  );

  useEffect(() => {
    // Load logo image and convert to base64
    fetch(logoImage)
      .then((response) => response.blob())
      .then((blob) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          setLogoBase64(reader.result as string);
        };
        reader.readAsDataURL(blob);
      })
      .catch(() => {
        console.warn('Could not load logo image');
      });
  }, []);

  useEffect(() => {
    setBreakfastPrice(foodPricing.breakfastPrice);
    setLunchPrice(foodPricing.lunchPrice);
    setTeaCoffeePrice(foodPricing.teaCoffeePrice);
  }, [foodPricing]);

  useEffect(() => {
    if (activeBookings.length === 0) {
      setSelectedBookingId('');
      setLastSavedBookingId('');
      setBreakfastCount(0);
      setLunchCount(0);
      setTeaCoffeeCount(0);
      return;
    }

    if (!selectedBookingId) {
      setBreakfastCount(0);
      setLunchCount(0);
      setTeaCoffeeCount(0);
      setOrderDate(getTodayDateString());
      return;
    }

    if (!activeBookings.some(booking => booking.id === selectedBookingId)) {
      setSelectedBookingId('');
      setBreakfastCount(0);
      setLunchCount(0);
      setTeaCoffeeCount(0);
      setOrderDate(getTodayDateString());
      return;
    }

    if (selectedBooking) {
      setBreakfastCount(selectedBooking.breakfastCount ?? 0);
      setLunchCount(selectedBooking.lunchCount ?? 0);
      setTeaCoffeeCount(selectedBooking.teaCoffeeCount ?? 0);
    }
  }, [activeBookings, selectedBooking, selectedBookingId]);

  useEffect(() => {
    if (selectedBookingId) return;

    if (lastSavedBookingId && foodBills.some((bill) => bill.bookingId === lastSavedBookingId)) {
      return;
    }

    const latestBill = [...foodBills].sort((a, b) => b.generatedAt.getTime() - a.generatedAt.getTime())[0] ?? null;
    setLastSavedBookingId(latestBill?.bookingId ?? '');
  }, [foodBills, lastSavedBookingId, selectedBookingId]);

  const handleSelectBooking = (bookingId: string) => {
    setSelectedBookingId(bookingId);
    const booking = activeBookings.find(item => item.id === bookingId);
    setBreakfastCount(booking?.breakfastCount ?? 0);
    setLunchCount(booking?.lunchCount ?? 0);
    setTeaCoffeeCount(booking?.teaCoffeeCount ?? 0);
    setOrderDate(getTodayDateString());
  };

  const mealRows = [
    {
      label: 'Breakfast',
      icon: Coffee,
      count: breakfastCount,
      unitPrice: breakfastPrice,
      amount: breakfastCount * breakfastPrice,
    },
    {
      label: 'Meal',
      icon: UtensilsCrossed,
      count: lunchCount,
      unitPrice: lunchPrice,
      amount: lunchCount * lunchPrice,
    },
    {
      label: 'Tea/Coffee',
      icon: Coffee,
      count: teaCoffeeCount,
      unitPrice: teaCoffeePrice,
      amount: teaCoffeeCount * teaCoffeePrice,
    },
  ];

  const totalAmount = mealRows.reduce((sum, row) => sum + row.amount, 0);

  const guestBillSummaries = useMemo(() => {
    const grouped = new Map<string, {
      guestName: string;
      breakfastTotal: number;
      lunchTotal: number;
      teaCoffeeTotal: number;
      totalAmount: number;
      billCount: number;
      latestGeneratedAt: Date;
    }>();

    for (const bill of foodBills) {
      const key = bill.guestName.trim().toLowerCase();
      const existing = grouped.get(key);

      if (!existing) {
        grouped.set(key, {
          guestName: bill.guestName,
          breakfastTotal: bill.breakfastTotal,
          lunchTotal: bill.lunchTotal,
          teaCoffeeTotal: bill.teaCoffeeTotal,
          totalAmount: bill.totalAmount,
          billCount: 1,
          latestGeneratedAt: bill.generatedAt,
        });
        continue;
      }

      existing.breakfastTotal += bill.breakfastTotal;
      existing.lunchTotal += bill.lunchTotal;
      existing.teaCoffeeTotal += bill.teaCoffeeTotal;
      existing.totalAmount += bill.totalAmount;
      existing.billCount += 1;
      if (bill.generatedAt > existing.latestGeneratedAt) {
        existing.latestGeneratedAt = bill.generatedAt;
      }
    }

    return Array.from(grouped.values()).sort((a, b) => b.latestGeneratedAt.getTime() - a.latestGeneratedAt.getTime());
  }, [foodBills]);

  const guestBillRecords = useMemo(() => {
    const grouped = new Map<string, FoodBill[]>();
    for (const bill of foodBills) {
      const key = bill.guestName.trim().toLowerCase();
      const list = grouped.get(key) ?? [];
      list.push(bill);
      grouped.set(key, list);
    }

    for (const [key, list] of grouped.entries()) {
      list.sort((a, b) => {
        const dateDiff = b.orderDate.localeCompare(a.orderDate);
        if (dateDiff !== 0) return dateDiff;
        return b.generatedAt.getTime() - a.generatedAt.getTime();
      });
      grouped.set(key, list);
    }

    return grouped;
  }, [foodBills]);

  const billInvoiceNumbers = useMemo(() => {
    const orderedBills = [...foodBills].sort((a, b) => {
      const orderDiff = a.orderDate.localeCompare(b.orderDate);
      if (orderDiff !== 0) return orderDiff;
      return a.generatedAt.getTime() - b.generatedAt.getTime();
    });

    const monthlySerials = new Map<string, number>();
    const invoiceNumbers = new Map<string, string>();

    for (const bill of orderedBills) {
      const monthKey = bill.orderDate.slice(0, 7);
      const serial = (monthlySerials.get(monthKey) ?? 0) + 1;
      monthlySerials.set(monthKey, serial);
      invoiceNumbers.set(bill.id, `TVUM/${monthKey.slice(5, 7)}/${String(serial).padStart(2, '0')}`);
    }

    return invoiceNumbers;
  }, [foodBills]);

  const previewBills = useMemo(() => {
    if (!previewGuestKey) return [];
    return guestBillRecords.get(previewGuestKey) ?? [];
  }, [guestBillRecords, previewGuestKey]);

  const previewGuestName = previewBills[0]?.guestName ?? '';
  const previewInvoiceNo = previewBills[0] ? billInvoiceNumbers.get(previewBills[0].id) ?? '' : '';
  const billingSheetBookingId = selectedBookingId || lastSavedBookingId;
  const latestSelectedBookingBill = useMemo(() => {
    if (!billingSheetBookingId) return null;
    return [...foodBills]
      .filter((bill) => bill.bookingId === billingSheetBookingId)
      .sort((a, b) => b.generatedAt.getTime() - a.generatedAt.getTime())[0] ?? null;
  }, [billingSheetBookingId, foodBills]);

  const billingSheetRows = latestSelectedBookingBill
    ? [
        {
          label: 'Breakfast',
          icon: Coffee,
          count: latestSelectedBookingBill.breakfastCount,
          unitPrice: latestSelectedBookingBill.breakfastPrice,
          amount: latestSelectedBookingBill.breakfastTotal,
        },
        {
          label: 'Meal',
          icon: UtensilsCrossed,
          count: latestSelectedBookingBill.lunchCount,
          unitPrice: latestSelectedBookingBill.lunchPrice,
          amount: latestSelectedBookingBill.lunchTotal,
        },
        {
          label: 'Tea/Coffee',
          icon: Coffee,
          count: latestSelectedBookingBill.teaCoffeeCount,
          unitPrice: latestSelectedBookingBill.teaCoffeePrice,
          amount: latestSelectedBookingBill.teaCoffeeTotal,
        },
      ]
    : mealRows;

  const billingSheetTotal = latestSelectedBookingBill ? latestSelectedBookingBill.totalAmount : totalAmount;
  const latestBillingSheetInvoiceNo = latestSelectedBookingBill
    ? billInvoiceNumbers.get(latestSelectedBookingBill.id) ?? ''
    : '';
  const previewSubTotal = useMemo(
    () => previewBills.reduce((sum, bill) => sum + bill.totalAmount, 0),
    [previewBills]
  );
  const previewGstAmount = isGstEnabled ? previewSubTotal * 0.05 : 0;
  const previewDiscountAmount = isDiscountEnabled ? (previewSubTotal + previewGstAmount) * (discountPercent / 100) : 0;
  const previewFinalTotal = previewSubTotal + previewGstAmount - previewDiscountAmount;

  const handlePrintPreviewBill = () => {
    if (previewBills.length === 0) {
      toast.error('No bill records available to print');
      return;
    }

    const subTotal = previewBills.reduce((sum, bill) => sum + bill.totalAmount, 0);
    const gstAmount = isGstEnabled ? subTotal * 0.05 : 0;
    const discountAmount = isDiscountEnabled ? (subTotal + gstAmount) * (discountPercent / 100) : 0;
    const grandTotal = subTotal + gstAmount - discountAmount;

    // Create item details from bills
    const itemDetails = previewBills.map((bill) => {
      const items = [];
      if (bill.breakfastCount > 0) {
        const unitPrice = bill.breakfastTotal / bill.breakfastCount;
        items.push(`<tr><td>${format(new Date(bill.orderDate), 'dd.MM.yyyy')}</td><td>Breakfast for ${bill.breakfastCount} person${bill.breakfastCount > 1 ? 's' : ''}</td><td style="text-align:right;">₹ ${unitPrice.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</td><td style="text-align:right;">₹ ${bill.breakfastTotal.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</td></tr>`);
      }
      if (bill.lunchCount > 0) {
        const unitPrice = bill.lunchTotal / bill.lunchCount;
        items.push(`<tr><td>${format(new Date(bill.orderDate), 'dd.MM.yyyy')}</td><td>Meal for ${bill.lunchCount} person${bill.lunchCount > 1 ? 's' : ''}</td><td style="text-align:right;">₹ ${unitPrice.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</td><td style="text-align:right;">₹ ${bill.lunchTotal.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</td></tr>`);
      }
      if (bill.teaCoffeeCount > 0) {
        const unitPrice = bill.teaCoffeeTotal / bill.teaCoffeeCount;
        items.push(`<tr><td>${format(new Date(bill.orderDate), 'dd.MM.yyyy')}</td><td>Tea/Coffee for ${bill.teaCoffeeCount} person${bill.teaCoffeeCount > 1 ? 's' : ''}</td><td style="text-align:right;">₹ ${unitPrice.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</td><td style="text-align:right;">₹ ${bill.teaCoffeeTotal.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</td></tr>`);
      }
      return items.join('');
    }).join('');

    const printWindow = window.open('', '_blank', 'width=980,height=1200');
    if (!printWindow) {
      toast.error('Unable to open print preview window');
      return;
    }

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title> ' '</title>
          <style>
            * { margin: 0; padding: 0; }
            body { font-family: 'Arial', sans-serif; padding: 40px; color: #333; }
            .container { max-width: 900px; margin: 0 auto; }
            .header { border: 2px solid #000; padding: 20px; margin-bottom: 20px; }
            .header-top { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 15px; gap: 20px; }
            .header-logo { flex-shrink: 0; }
            .header-logo img { width: 80px; height: 80px; object-fit: contain; }
            .header-left { flex: 1; }
            .header-right { flex: 1; text-align: right; }
            .hotel-name { font-size: 24px; font-weight: bold; margin-bottom: 5px; }
            .hotel-info { font-size: 11px; line-height: 1.6; }
            .header-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 30px; margin-top: 15px; padding-top: 15px; border-top: 1px solid #000; }
            .header-cell { font-size: 11px; }
            .header-cell-label { font-weight: bold; }
            .food-bill-title { text-align: center; font-size: 18px; font-weight: bold; margin-top: 15px; }
            .table-container { margin: 20px 0; }
            table { width: 100%; border-collapse: collapse; font-size: 11px; }
            th, td { border: 1px solid #000; padding: 8px; text-align: left; }
            th { background-color: #f0f0f0; font-weight: bold; }
            .amount-col { text-align: right; }
            .qty-col { text-align: center; }
            .summary-section { margin-top: 20px; margin-left: auto; width: 300px; }
            .summary-row { display: flex; justify-content: space-between; padding: 6px 0; font-size: 11px; }
            .summary-label { flex: 1; }
            .summary-amount { text-align: right; min-width: 80px; }
            .grand-total { font-weight: bold; border-top: 2px solid #000; padding-top: 8px; margin-top: 8px; font-size: 12px; }
            .footer-section { margin-top: 30px; display: grid; grid-template-columns: 1fr 1fr; gap: 20px; font-size: 10px; }
            .footer-cell { }
            .footer-label { font-weight: bold; margin-bottom: 5px; }
            .signature-area { border-top: 1px solid #000; margin-top: 30px; padding-top: 20px; text-align: right; font-size: 10px; }
            .jurisdiction { text-align: center; margin-top: 20px; font-weight: bold; font-size: 10px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <div class="header-top">
                <div class="header-logo">
                  <img src="${logoBase64}" alt="TVUM Suites Logo">
                </div>
                <div class="header-left">
                  <div class="hotel-name">TVUM SUITES</div>
                  <div class="hotel-info">
                    <div>3, Midas Touch</div>
                    <div>94 Lulla Nagar, Pune - 411040</div>
                    <div>Mobile:- +91 8888999939</div>
                  </div>
                </div>
                <div class="header-right">
                  <div style="margin-bottom: 10px;">
                    <div class="header-cell-label">Invoice No</div>
                    <div style="font-size: 13px; font-weight: bold;">${previewInvoiceNo || 'TVUM/--/--'}</div>
                  </div>
                  <div>
                    <div class="header-cell-label">Date</div>
                    <div style="font-size: 12px;">${format(new Date(), 'dd.MM.yyyy')}</div>
                  </div>
                </div>
              </div>
              <div class="header-grid">
                <div>
                  <div class="header-cell"><span class="header-cell-label">Suite No.</span></div>
                  <div style="font-size: 12px;">${previewBills[0]?.roomNumber || '-'}</div>
                </div>
                <div>
                  <div class="header-cell"><span class="header-cell-label">Guest</span></div>
                  <div style="font-size: 12px;">${previewGuestName}</div>
                </div>
              </div>
            </div>

            <div class="food-bill-title">FOOD BILL</div>

            <div class="table-container">
              <table>
                <thead>
                  <tr>
                    <th style="width: 15%;">Dates</th>
                    <th style="width: 35%;">Summary of Services</th>
                    <th style="width: 15%;">Rate</th>
                    <th style="width: 35%;">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  ${itemDetails}
                </tbody>
              </table>
            </div>

            <div class="summary-section">
              <div class="summary-row">
                <div class="summary-label">Subtotal</div>
                <div class="summary-amount">₹ ${subTotal.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</div>
              </div>
              ${isGstEnabled ? `<div class="summary-row">
                <div class="summary-label">GST (5%)</div>
                <div class="summary-amount">₹ ${gstAmount.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</div>
              </div>` : ''}
              ${isDiscountEnabled ? `<div class="summary-row">
                <div class="summary-label">Discount (${discountPercent}%)</div>
                <div class="summary-amount">- ₹ ${discountAmount.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</div>
              </div>` : ''}
              <div class="summary-row grand-total">
                <div class="summary-label">TOTAL</div>
                <div class="summary-amount">₹ ${grandTotal.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</div>
              </div>
            </div>

            <div class="footer-section">
              <div class="footer-cell">
                <div class="footer-label">PAN No:</div>
                <div>ONRPS6145C</div>
              </div>
              <div class="footer-cell">
                <div class="footer-label">Payment Method</div>
              </div>
            </div>

            <div class="signature-area">
              <div class="footer-label">For TVUM Suites</div>
              <div style="margin-top: 40px;">Signature</div>
            </div>

            <div class="jurisdiction">
              SUBJECT TO PUNE JURISDICTION
            </div>
          </div>
        </body>
      </html>
    `);

    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
  };

  const handlePrintLatestBillingSheet = () => {
    if (!latestSelectedBookingBill || !selectedBooking) {
      toast.error('No recent saved bill available to print');
      return;
    }

    const invoiceNo = latestBillingSheetInvoiceNo || 'TVUM/--/--';
    const subtotal = latestSelectedBookingBill.totalAmount;
    const gstAmount = isGstEnabled ? subtotal * 0.05 : 0;
    const discountAmount = isDiscountEnabled ? (subtotal + gstAmount) * (discountPercent / 100) : 0;
    const grandTotal = subtotal + gstAmount - discountAmount;

    // Create item details
    const itemRows = [];
    if (latestSelectedBookingBill.breakfastCount > 0) {
      itemRows.push(`<tr><td>${format(new Date(latestSelectedBookingBill.orderDate), 'dd.MM.yyyy')}</td><td>Breakfast for ${latestSelectedBookingBill.breakfastCount} person${latestSelectedBookingBill.breakfastCount > 1 ? 's' : ''}</td><td style="text-align:right;">₹ ${latestSelectedBookingBill.breakfastPrice.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</td><td style="text-align:right;">₹ ${latestSelectedBookingBill.breakfastTotal.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</td></tr>`);
    }
    if (latestSelectedBookingBill.lunchCount > 0) {
      itemRows.push(`<tr><td>Meal for ${latestSelectedBookingBill.lunchCount} person${latestSelectedBookingBill.lunchCount > 1 ? 's' : ''}</td><td style="text-align:right;">₹ ${latestSelectedBookingBill.lunchPrice.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</td><td style="text-align:right;">₹ ${latestSelectedBookingBill.lunchTotal.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</td></tr>`);
    }
    if (latestSelectedBookingBill.teaCoffeeCount > 0) {
      itemRows.push(`<tr><td>Tea/Coffee for ${latestSelectedBookingBill.teaCoffeeCount} person${latestSelectedBookingBill.teaCoffeeCount > 1 ? 's' : ''}</td><td style="text-align:right;">₹ ${latestSelectedBookingBill.teaCoffeePrice.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</td><td style="text-align:right;">₹ ${latestSelectedBookingBill.teaCoffeeTotal.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</td></tr>`);
    }

    const printWindow = window.open('', '_blank', 'width=980,height=1200');
    if (!printWindow) {
      toast.error('Unable to open print preview window');
      return;
    }

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>TVUM Suites - Food Bill</title>
          <style>
            * { margin: 0; padding: 0; }
            body { font-family: 'Arial', sans-serif; padding: 40px; color: #333; }
            .container { max-width: 900px; margin: 0 auto; }
            .header { border: 2px solid #000; padding: 20px; margin-bottom: 20px; }
            .header-top { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 15px; gap: 20px; }
            .header-logo { flex-shrink: 0; }
            .header-logo img { width: 80px; height: 80px; object-fit: contain; }
            .header-left { flex: 1; }
            .header-right { flex: 1; text-align: right; }
            .hotel-name { font-size: 24px; font-weight: bold; margin-bottom: 5px; }
            .hotel-info { font-size: 11px; line-height: 1.6; }
            .header-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 30px; margin-top: 15px; padding-top: 15px; border-top: 1px solid #000; }
            .header-cell { font-size: 11px; }
            .header-cell-label { font-weight: bold; }
            .food-bill-title { text-align: center; font-size: 18px; font-weight: bold; margin-top: 15px; }
            .table-container { margin: 20px 0; }
            table { width: 100%; border-collapse: collapse; font-size: 11px; }
            th, td { border: 1px solid #000; padding: 8px; text-align: left; }
            th { background-color: #f0f0f0; font-weight: bold; }
            .amount-col { text-align: right; }
            .qty-col { text-align: center; }
            .summary-section { margin-top: 20px; margin-left: auto; width: 300px; }
            .summary-row { display: flex; justify-content: space-between; padding: 6px 0; font-size: 11px; }
            .summary-label { flex: 1; }
            .summary-amount { text-align: right; min-width: 80px; }
            .grand-total { font-weight: bold; border-top: 2px solid #000; padding-top: 8px; margin-top: 8px; font-size: 12px; }
            .footer-section { margin-top: 30px; display: grid; grid-template-columns: 1fr 1fr; gap: 20px; font-size: 10px; }
            .footer-cell { }
            .footer-label { font-weight: bold; margin-bottom: 5px; }
            .signature-area { border-top: 1px solid #000; margin-top: 30px; padding-top: 20px; text-align: right; font-size: 10px; }
            .jurisdiction { text-align: center; margin-top: 20px; font-weight: bold; font-size: 10px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <div class="header-top">
                <div class="header-logo">
                  <img src="${logoBase64}" alt="TVUM Suites Logo">
                </div>
                <div class="header-left">
                  <div class="hotel-name">TVUM SUITES</div>
                  <div class="hotel-info">
                    <div>3, Midas Touch</div>
                    <div>94 Lulla Nagar, Pune - 411040</div>
                    <div>Mobile:- +91 8888999939</div>
                  </div>
                </div>
                <div class="header-right">
                  <div style="margin-bottom: 10px;">
                    <div class="header-cell-label">Invoice No</div>
                    <div style="font-size: 13px; font-weight: bold;">${invoiceNo}</div>
                  </div>
                  <div>
                    <div class="header-cell-label">Date</div>
                    <div style="font-size: 12px;">${format(new Date(), 'dd.MM.yyyy')}</div>
                  </div>
                </div>
              </div>
              <div class="header-grid">
                <div>
                  <div class="header-cell"><span class="header-cell-label">Suite No.</span></div>
                  <div style="font-size: 12px;">${selectedBooking.roomNumber}</div>
                </div>
                <div>
                  <div class="header-cell"><span class="header-cell-label">Guest</span></div>
                  <div style="font-size: 12px;">${selectedBooking.guestName}</div>
                </div>
              </div>
            </div>

            <div class="food-bill-title">FOOD BILL</div>

            <div class="table-container">
              <table>
                <thead>
                  <tr>
                    <th style="width: 15%;">Dates</th>
                    <th style="width: 35%;">Summary of Services</th>
                    <th style="width: 15%;">Rate</th>
                    <th style="width: 35%;">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  ${itemRows.join('')}
                </tbody>
              </table>
            </div>

            <div class="summary-section">
              <div class="summary-row">
                <div class="summary-label">Subtotal</div>
                <div class="summary-amount">₹ ${subtotal.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</div>
              </div>
              ${isGstEnabled ? `<div class="summary-row">
                <div class="summary-label">GST (5%)</div>
                <div class="summary-amount">₹ ${gstAmount.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</div>
              </div>` : ''}
              ${isDiscountEnabled ? `<div class="summary-row">
                <div class="summary-label">Discount (${discountPercent}%)</div>
                <div class="summary-amount">- ₹ ${discountAmount.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</div>
              </div>` : ''}
              <div class="summary-row grand-total">
                <div class="summary-label">TOTAL</div>
                <div class="summary-amount">₹ ${grandTotal.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</div>
              </div>
            </div>

            <div class="footer-section">
              <div class="footer-cell">
                <div class="footer-label">PAN No:</div>
                <div>ONRPS6145C</div>
              </div>
              <div class="footer-cell">
                <div class="footer-label">Payment Method</div>
              </div>
            </div>

            <div class="signature-area">
              <div class="footer-label">For TVUM Suites</div>
              <div style="margin-top: 40px;">Signature</div>
            </div>

            <div class="jurisdiction">
              SUBJECT TO PUNE JURISDICTION
            </div>
          </div>
        </body>
      </html>
    `);

    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
  };

  const printSavedBill = (payload: {
    guestName: string;
    invoiceNo: string;
    roomNumber: string;
    orderDate: string;
    breakfastCount: number;
    breakfastPrice: number;
    breakfastTotal: number;
    lunchCount: number;
    lunchPrice: number;
    lunchTotal: number;
    teaCoffeeCount: number;
    teaCoffeePrice: number;
    teaCoffeeTotal: number;
    totalAmount: number;
  }) => {
    const printWindow = window.open('', '_blank', 'width=980,height=1200');
    if (!printWindow) {
      toast.error('Bill saved, but print window could not be opened');
      return;
    }

    const subtotal = payload.totalAmount;
    const gstAmount = 0;
    const discountAmount = 0;
    const grandTotal = subtotal + gstAmount - discountAmount;

    // Create item details
    const itemRows = [];
    if (payload.breakfastCount > 0) {
      itemRows.push(`<tr><td>${format(new Date(payload.orderDate), 'dd.MM.yyyy')}</td><td>Breakfast for ${payload.breakfastCount} person${payload.breakfastCount > 1 ? 's' : ''}</td><td style="text-align:right;">₹ ${payload.breakfastPrice.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</td><td style="text-align:right;">₹ ${payload.breakfastTotal.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</td></tr>`);
    }
    if (payload.lunchCount > 0) {
      itemRows.push(`<tr><td>${format(new Date(payload.orderDate), 'dd.MM.yyyy')}</td><td>Meal for ${payload.lunchCount} person${payload.lunchCount > 1 ? 's' : ''}</td><td style="text-align:right;">₹ ${payload.lunchPrice.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</td><td style="text-align:right;">₹ ${payload.lunchTotal.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</td></tr>`);
    }
    if (payload.teaCoffeeCount > 0) {
      itemRows.push(`<tr><td>${format(new Date(payload.orderDate), 'dd.MM.yyyy')}</td><td>Tea/Coffee for ${payload.teaCoffeeCount} person${payload.teaCoffeeCount > 1 ? 's' : ''}</td><td style="text-align:right;">₹ ${payload.teaCoffeePrice.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</td><td style="text-align:right;">₹ ${payload.teaCoffeeTotal.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</td></tr>`);
    }

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>.</title>
          <style>
            * { margin: 0; padding: 0; }
            body { font-family: 'Arial', sans-serif; padding: 40px; color: #333; }
            .container { max-width: 900px; margin: 0 auto; }
            .header { border: 2px solid #000; padding: 20px; margin-bottom: 20px; }
            .header-top { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 15px; gap: 20px; }
            .header-logo { flex-shrink: 0; }
            .header-logo img { width: 80px; height: 80px; object-fit: contain; }
            .header-left { flex: 1; }
            .header-right { flex: 1; text-align: right; }
            .hotel-name { font-size: 24px; font-weight: bold; margin-bottom: 5px; }
            .hotel-info { font-size: 11px; line-height: 1.6; }
            .header-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 30px; margin-top: 15px; padding-top: 15px; border-top: 1px solid #000; }
            .header-cell { font-size: 11px; }
            .header-cell-label { font-weight: bold; }
            .food-bill-title { text-align: center; font-size: 18px; font-weight: bold; margin-top: 15px; }
            .table-container { margin: 20px 0; }
            table { width: 100%; border-collapse: collapse; font-size: 11px; }
            th, td { border: 1px solid #000; padding: 8px; text-align: left; }
            th { background-color: #f0f0f0; font-weight: bold; }
            .amount-col { text-align: right; }
            .qty-col { text-align: center; }
            .summary-section { margin-top: 20px; margin-left: auto; width: 300px; }
            .summary-row { display: flex; justify-content: space-between; padding: 6px 0; font-size: 11px; }
            .summary-label { flex: 1; }
            .summary-amount { text-align: right; min-width: 80px; }
            .grand-total { font-weight: bold; border-top: 2px solid #000; padding-top: 8px; margin-top: 8px; font-size: 12px; }
            .footer-section { margin-top: 30px; display: grid; grid-template-columns: 1fr 1fr; gap: 20px; font-size: 10px; }
            .footer-cell { }
            .footer-label { font-weight: bold; margin-bottom: 5px; }
            .signature-area { border-top: 1px solid #000; margin-top: 30px; padding-top: 20px; text-align: right; font-size: 10px; }
            .jurisdiction { text-align: center; margin-top: 20px; font-weight: bold; font-size: 10px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <div class="header-top">
                <div class="header-logo">
                  <img src="${logoBase64}" alt="TVUM Suites Logo">
                </div>
                <div class="header-left">
                  <div class="hotel-name">TVUM SUITES</div>
                  <div class="hotel-info">
                    <div>3, Midas Touch</div>
                    <div>94 Lulla Nagar, Pune - 411040</div>
                    <div>Mobile:- +91 8888999939</div>
                  </div>
                </div>
                <div class="header-right">
                  <div style="margin-bottom: 10px;">
                    <div class="header-cell-label">Invoice No</div>
                    <div style="font-size: 13px; font-weight: bold;">${payload.invoiceNo}</div>
                  </div>
                  <div>
                    <div class="header-cell-label">Date</div>
                    <div style="font-size: 12px;">${format(new Date(), 'dd.MM.yyyy')}</div>
                  </div>
                </div>
              </div>
              <div class="header-grid">
                <div>
                  <div class="header-cell"><span class="header-cell-label">Suite No.</span></div>
                  <div style="font-size: 12px;">${payload.roomNumber}</div>
                </div>
                <div>
                  <div class="header-cell"><span class="header-cell-label">Guest</span></div>
                  <div style="font-size: 12px;">${payload.guestName}</div>
                </div>
              </div>
            </div>

            <div class="food-bill-title">FOOD BILL</div>

            <div class="table-container">
              <table>
                <thead>
                  <tr>
                    <th style="width: 15%;">Dates</th>
                    <th style="width: 35%;">Summary of Services</th>
                    <th style="width: 15%;">Rate</th>
                    <th style="width: 35%;">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  ${itemRows.join('')}
                </tbody>
              </table>
            </div>

            <div class="summary-section">
              <div class="summary-row">
                <div class="summary-label">Subtotal</div>
                <div class="summary-amount">₹ ${subtotal.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</div>
              </div>
              <div class="summary-row grand-total">
                <div class="summary-label">TOTAL</div>
                <div class="summary-amount">₹ ${grandTotal.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</div>
              </div>
            </div>

            <div class="footer-section">
              <div class="footer-cell">
                <div class="footer-label">PAN No:</div>
                <div>ONRPS6145C</div>
              </div>
              <div class="footer-cell">
                <div class="footer-label">Payment Method</div>
              </div>
            </div>

            <div class="signature-area">
              <div class="footer-label">For TVUM Suites</div>
              <div style="margin-top: 40px;">Signature</div>
            </div>

            <div class="jurisdiction">
              SUBJECT TO PUNE JURISDICTION
            </div>
          </div>
        </body>
      </html>
    `);

    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
  };

  const Counter = ({
    label,
    icon: Icon,
    value,
    onChange,
  }: {
    label: string;
    icon: React.ElementType;
    value: number;
    onChange: (value: number) => void;
  }) => (
    <div className="rounded-xl border border-border bg-background p-4">
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
            <Icon className="h-5 w-5 text-primary" />
          </div>
          <div>
            <p className="font-medium text-foreground">{label}</p>
            <p className="text-xs text-muted-foreground">Add the meal count for this booking</p>
          </div>
        </div>
        <div className="flex items-center justify-center gap-3 pt-2">
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="h-10 w-10 rounded-full"
            onClick={() => onChange(Math.max(0, value - 1))}
            disabled={value <= 0}
          >
            <Minus className="h-5 w-5" />
          </Button>
          <span className="w-10 text-center text-xl font-semibold text-foreground">{value}</span>
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="h-10 w-10 rounded-full"
            onClick={() => onChange(value + 1)}
          >
            <Plus className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </div>
  );

  const handleSaveCounts = async () => {
    if (!selectedBooking) {
      toast.error('Please select a booking first');
      return;
    }

    const breakfastTotal = breakfastCount * breakfastPrice;
    const lunchTotal = lunchCount * lunchPrice;
    const teaCoffeeTotal = teaCoffeeCount * teaCoffeePrice;
    const totalAmount = breakfastTotal + lunchTotal + teaCoffeeTotal;

    const { error } = await saveFoodBill({
      bookingId: selectedBooking.id,
      roomNumber: selectedBooking.roomNumber,
      guestName: selectedBooking.guestName,
      orderDate,
      breakfastCount,
      lunchCount,
      teaCoffeeCount,
      breakfastPrice,
      lunchPrice,
      teaCoffeePrice,
      breakfastTotal,
      lunchTotal,
      teaCoffeeTotal,
      totalAmount,
    });

    if (error) {
      toast.error('Bill could not be saved', {
        description: error,
      });
      return;
    }

    const monthKey = orderDate.slice(0, 7);
    const nextSerial = foodBills.filter((bill) => bill.orderDate.slice(0, 7) === monthKey).length + 1;
    const invoiceNo = `TVUM/${monthKey.slice(5, 7)}/${String(nextSerial).padStart(2, '0')}`;

    printSavedBill({
      guestName: selectedBooking.guestName,
      invoiceNo,
      roomNumber: selectedBooking.roomNumber.toString(),
      orderDate,
      breakfastCount,
      breakfastPrice,
      breakfastTotal,
      lunchCount,
      lunchPrice,
      lunchTotal,
      teaCoffeeCount,
      teaCoffeePrice,
      teaCoffeeTotal,
      totalAmount,
    });

    setLastSavedBookingId(selectedBooking.id);

    await updateBooking(selectedBooking.id, {
      breakfastCount: 0,
      lunchCount: 0,
      teaCoffeeCount: 0,
    });

    setSelectedBookingId('');
    setBreakfastCount(0);
    setLunchCount(0);
    setTeaCoffeeCount(0);
    setOrderDate(getTodayDateString());

    toast.success('Food count saved and ready to print', {
      description: `${selectedBooking.guestName} • ${currency.format(totalAmount)} bill saved to Saved Bills`,
    });
  };

  const handleSavePrices = async () => {
    if (!canEditPrices) {
      toast.error('Only Owner and Admin can edit food prices');
      return;
    }

    const { error } = await updateFoodPricing({ breakfastPrice, lunchPrice, teaCoffeePrice });
    if (error) {
      toast.error('Food prices could not be saved', { description: error });
      return;
    }

    toast.success('Food prices saved to Supabase');
  };

  return (
    <div className="mx-auto max-w-7xl slide-up">
      <div className="mb-8">
        <h1 className="text-3xl font-serif font-semibold text-foreground">Food</h1>
        <p className="mt-1 text-muted-foreground">Choose a booking, set meal counts, edit prices, and review the bill in a table format.</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-1 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="space-y-6">
          <Card className="border-border shadow-sm">
            <CardHeader className="space-y-3">
              <CardTitle className="flex items-center gap-2 text-xl font-serif">
                <ReceiptText className="h-5 w-5 text-primary" />
                Booking Food Entry
              </CardTitle>
              <div className="space-y-2">
                <Label className="text-xs uppercase tracking-wider text-muted-foreground">Select booking</Label>
                <Select value={selectedBookingId} onValueChange={handleSelectBooking}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Choose a booking" />
                  </SelectTrigger>
                  <SelectContent>
                    {activeBookings.length === 0 ? (
                      <SelectItem value="none" disabled>
                        No bookings available
                      </SelectItem>
                    ) : (
                      activeBookings.map(booking => (
                        <SelectItem key={booking.id} value={booking.id}>
                          Room {booking.roomNumber} - {booking.guestName}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-xs uppercase tracking-wider text-muted-foreground">Order date</Label>
                <Input type="date" value={orderDate} onChange={e => setOrderDate(e.target.value || getTodayDateString())} />
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {selectedBooking ? (
                <>
                  <div className="grid gap-3 md:grid-cols-2">
                    <div className="rounded-xl border border-border bg-background p-4">
                      <p className="text-xs uppercase tracking-wider text-muted-foreground">Guest</p>
                      <p className="mt-2 text-lg font-semibold text-foreground">{selectedBooking.guestName}</p>
                      <p className="text-sm text-muted-foreground">Room {selectedBooking.roomNumber}</p>
                    </div>
                    <div className="rounded-xl border border-border bg-background p-4">
                      <p className="text-xs uppercase tracking-wider text-muted-foreground">Stay</p>
                      <p className="mt-2 text-sm font-medium text-foreground">
                        {format(new Date(selectedBooking.checkIn), 'MMM d, yyyy')} to {format(new Date(selectedBooking.checkOut), 'MMM d, yyyy')}
                      </p>
                      <div className="mt-2 flex flex-wrap gap-2">
                        <Badge variant="outline" className="bg-secondary/50 capitalize">
                          {selectedBooking.status}
                        </Badge>
                        <Badge variant="outline" className="bg-secondary/50">
                          <Users className="mr-1 h-3.5 w-3.5" />
                          {selectedBooking.adults + selectedBooking.children + selectedBooking.infants} guests
                        </Badge>
                      </div>
                    </div>
                  </div>

                  <div className="grid gap-4 md:grid-cols-3 sm:grid-cols-2">
                    <Counter label="Breakfast" icon={Coffee} value={breakfastCount} onChange={setBreakfastCount} />
                    <Counter label="Meal" icon={UtensilsCrossed} value={lunchCount} onChange={setLunchCount} />
                    <Counter label="Tea/Coffee" icon={Coffee} value={teaCoffeeCount} onChange={setTeaCoffeeCount} />
                  </div>

                  <Button type="button" onClick={handleSaveCounts} className="w-full sm:w-auto">
                    Save & Print
                  </Button>
                </>
              ) : (
                <div className="rounded-xl border border-dashed border-border bg-background p-10 text-center text-muted-foreground">
                  No booking selected.
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="border-border shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between gap-3">
              <div>
                <CardTitle className="text-xl font-serif">Billing Sheet</CardTitle>
                <p className="text-sm text-muted-foreground">Spreadsheet-style summary for the selected booking.</p>
              </div>
              <div className="text-right">
                <p className="text-xs uppercase tracking-wider text-muted-foreground">Grand total</p>
                <p className="text-2xl font-semibold text-foreground">{currency.format(totalAmount)}</p>
              </div>
            </CardHeader>
            <CardContent>
              <div className="overflow-hidden rounded-xl border border-border bg-background">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Item</TableHead>
                      <TableHead className="text-right hidden sm:table-cell">Count</TableHead>
                      <TableHead className="text-right hidden sm:table-cell">Unit Price</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {mealRows.map(row => (
                      <TableRow key={row.label}>
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2">
                            <row.icon className="h-4 w-4 text-primary" />
                            {row.label}
                          </div>
                        </TableCell>
                        <TableCell className="text-right hidden sm:table-cell">{row.count}</TableCell>
                        <TableCell className="text-right hidden sm:table-cell">{currency.format(row.unitPrice)}</TableCell>
                        <TableCell className="text-right font-medium">{currency.format(row.amount)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                  <TableFooter>
                    <TableRow>
                      <TableCell colSpan={3} className="text-right font-semibold hidden sm:table-cell">
                        Total Bill
                      </TableCell>
                      <TableCell className="font-semibold sm:hidden">Total Bill</TableCell>
                      <TableCell className="text-right font-semibold">{currency.format(totalAmount)}</TableCell>
                    </TableRow>
                  </TableFooter>
                </Table>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="border-border shadow-sm">
            <CardHeader className="space-y-2">
              <div className="flex items-center justify-between gap-3">
                <CardTitle className="text-xl font-serif">Meal Prices</CardTitle>
                <Badge variant="outline" className="bg-secondary/50">
                  {canEditPrices ? 'Editable' : 'Locked'}
                </Badge>
              </div>
              {!canEditPrices && (
                <p className="text-sm text-muted-foreground">Only Owner and Admin can edit breakfast and meal prices.</p>
              )}
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-xs uppercase tracking-wider text-muted-foreground">Breakfast price</Label>
                <div className="mt-1.5 flex items-center gap-2">
                  <Input
                    type="number"
                    min="0"
                    step="1"
                    value={breakfastPrice}
                    onChange={e => setBreakfastPrice(Math.max(0, Number(e.target.value) || 0))}
                    disabled={!canEditPrices}
                  />
                  <span className="text-sm font-medium text-muted-foreground">/ meal</span>
                </div>
              </div>

              <div>
                <Label className="text-xs uppercase tracking-wider text-muted-foreground">Meal price</Label>
                <div className="mt-1.5 flex items-center gap-2">
                  <Input
                    type="number"
                    min="0"
                    step="1"
                    value={lunchPrice}
                    onChange={e => setLunchPrice(Math.max(0, Number(e.target.value) || 0))}
                    disabled={!canEditPrices}
                  />
                  <span className="text-sm font-medium text-muted-foreground">/ meal</span>
                </div>
              </div>

              <div>
                <Label className="text-xs uppercase tracking-wider text-muted-foreground">Tea/Coffee price</Label>
                <div className="mt-1.5 flex items-center gap-2">
                  <Input
                    type="number"
                    min="0"
                    step="1"
                    value={teaCoffeePrice}
                    onChange={e => setTeaCoffeePrice(Math.max(0, Number(e.target.value) || 0))}
                    disabled={!canEditPrices}
                  />
                  <span className="text-sm font-medium text-muted-foreground">/ meal</span>
                </div>
              </div>

              <Button type="button" onClick={handleSavePrices} disabled={!canEditPrices} className="w-full">
                <Lock className="mr-2 h-4 w-4" />
                Save Food Prices
              </Button>
            </CardContent>
          </Card>

          <Card className="border-border shadow-sm">
            <CardHeader>
              <CardTitle className="text-xl font-serif">Saved Bills</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto rounded-xl border border-border bg-background">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Guest</TableHead>
                      <TableHead className="text-right">Bills</TableHead>
                      <TableHead className="text-right hidden sm:table-cell">Breakfast</TableHead>
                      <TableHead className="text-right hidden sm:table-cell">Meal</TableHead>
                      <TableHead className="text-right hidden md:table-cell">Tea/Coffee</TableHead>
                      <TableHead className="text-right">Total</TableHead>
                      <TableHead className="text-right">Preview</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {guestBillSummaries.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="py-8 text-center text-muted-foreground">
                          No saved bills yet.
                        </TableCell>
                      </TableRow>
                    ) : (
                      guestBillSummaries.map(summary => (
                        <TableRow key={summary.guestName}>
                          <TableCell>
                            <div>
                              <p className="font-medium text-foreground">{summary.guestName}</p>
                              <p className="text-xs text-muted-foreground">Combined guest bill</p>
                            </div>
                          </TableCell>
                          <TableCell className="text-right">{summary.billCount}</TableCell>
                          <TableCell className="text-right hidden sm:table-cell">{currency.format(summary.breakfastTotal)}</TableCell>
                          <TableCell className="text-right hidden sm:table-cell">{currency.format(summary.lunchTotal)}</TableCell>
                          <TableCell className="text-right hidden md:table-cell">{currency.format(summary.teaCoffeeTotal)}</TableCell>
                          <TableCell className="text-right font-semibold">{currency.format(summary.totalAmount)}</TableCell>
                          <TableCell className="text-right">
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              className="h-8 px-2 sm:px-3"
                              onClick={() => setPreviewGuestKey(summary.guestName.trim().toLowerCase())}
                            >
                              Preview
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <Dialog
        open={!!previewGuestKey}
        onOpenChange={(open) => {
          if (!open) {
            setPreviewGuestKey(null);
            setIsGstEnabled(true);
            setIsDiscountEnabled(false);
          }
        }}
      >
        <DialogContent className="max-w-5xl">
          <DialogHeader>
            <div className="flex items-center justify-between gap-3">
              <DialogTitle className="font-serif text-xl">Food Bill Preview - {previewGuestName}</DialogTitle>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="gst-5-toggle"
                    checked={isGstEnabled}
                    onCheckedChange={(checked) => setIsGstEnabled(checked === true)}
                  />
                  <Label htmlFor="gst-5-toggle" className="cursor-pointer text-sm font-medium text-foreground">
                    GST 5%
                  </Label>
                </div>
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="discount-toggle"
                    checked={isDiscountEnabled}
                    onCheckedChange={(checked) => setIsDiscountEnabled(checked === true)}
                  />
                  <Label htmlFor="discount-toggle" className="cursor-pointer text-sm font-medium text-foreground">
                    Discount
                  </Label>
                  {isDiscountEnabled && (
                    <Input
                      type="number"
                      min="0"
                      max="100"
                      value={discountPercent}
                      onChange={(e) => setDiscountPercent(Number(e.target.value) || 0)}
                      className="w-16 h-8 text-xs"
                      placeholder="%"
                    />
                  )}
                  <span className="text-sm">%</span>
                </div>
                <Button type="button" variant="outline" size="sm" onClick={handlePrintPreviewBill}>
                  <Printer className="mr-2 h-4 w-4" />
                  Print
                </Button>
              </div>
            </div>
          </DialogHeader>
          <div className="max-h-[70vh] overflow-auto rounded-xl border border-border bg-background">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Room</TableHead>
                  <TableHead className="text-right">Breakfast Qty</TableHead>
                  <TableHead className="text-right">Breakfast Amt</TableHead>
                  <TableHead className="text-right">Lunch Qty</TableHead>
                  <TableHead className="text-right">Lunch Amt</TableHead>
                  <TableHead className="text-right">Tea/Coffee Qty</TableHead>
                  <TableHead className="text-right">Tea/Coffee Amt</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {previewBills.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="py-8 text-center text-muted-foreground">
                      No records found.
                    </TableCell>
                  </TableRow>
                ) : (
                  previewBills.map((bill) => (
                    <TableRow key={bill.id}>
                      <TableCell>{format(new Date(bill.orderDate), 'MMM d, yyyy')}</TableCell>
                      <TableCell>Room {bill.roomNumber}</TableCell>
                      <TableCell className="text-right">{bill.breakfastCount}</TableCell>
                      <TableCell className="text-right">{currency.format(bill.breakfastTotal)}</TableCell>
                      <TableCell className="text-right">{bill.lunchCount}</TableCell>
                      <TableCell className="text-right">{currency.format(bill.lunchTotal)}</TableCell>
                      <TableCell className="text-right">{bill.teaCoffeeCount}</TableCell>
                      <TableCell className="text-right">{currency.format(bill.teaCoffeeTotal)}</TableCell>
                      <TableCell className="text-right font-semibold">{currency.format(bill.totalAmount)}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
          <div className="grid gap-2 rounded-xl border border-border bg-background p-4 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Subtotal</span>
              <span className="font-medium text-foreground">{currency.format(previewSubTotal)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">GST (5%)</span>
              <span className="font-medium text-foreground">{currency.format(previewGstAmount)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Discount ({discountPercent}%)</span>
              <span className="font-medium text-foreground">- {currency.format(previewDiscountAmount)}</span>
            </div>
            <div className="flex items-center justify-between border-t border-border pt-2">
              <span className="font-semibold text-foreground">Final Total</span>
              <span className="text-base font-semibold text-foreground">{currency.format(previewFinalTotal)}</span>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default FoodPage;
