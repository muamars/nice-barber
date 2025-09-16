﻿"use client";

import { useEffect, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Plus,
  Scissors,
  Clock,
  User,
  Phone,
  RefreshCw,
  Calendar,
  TrendingUp,
  Download,
  Loader2,
  ChevronLeft,
  ChevronRight,
  CheckCircle,
  XCircle,
} from "lucide-react";
import Logo from "@/assets/NICE.png";
import Image from "next/image";
import Select from "react-select";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

type Appointment = {
  id: number;
  date: string;
  time: string;
  customer: { id: number; name: string; whatsapp: string } | null;
  treatments: { name: string } | null;
  capsters: { name: string } | null;
};

type GroupedAppointment = {
  id: string; // Combined ID for grouped appointments
  date: string;
  time: string;
  customer: { id: number; name: string; whatsapp: string } | null;
  treatments: string[]; // Array of treatment names
  capsters: { name: string } | null;
};

type Customer = { id: number; name: string; whatsapp: string };

export default function Home() {
  const [appointments, setAppointments] = useState<GroupedAppointment[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [currentTime, setCurrentTime] = useState<Date | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [isExporting, setIsExporting] = useState(false);
  const [showExportResult, setShowExportResult] = useState(false);
  const [exportResult, setExportResult] = useState<{
    success: boolean;
    message: string;
    exportedCount?: number;
  } | null>(null);

  // Function to group appointments by customer, time, and capster
  function groupAppointments(
    rawAppointments: Appointment[]
  ): GroupedAppointment[] {
    const grouped: { [key: string]: GroupedAppointment } = {};

    rawAppointments.forEach((appointment) => {
      // Check for null/undefined critical fields
      if (!appointment.customer || !appointment.customer.id) {
        return;
      }

      if (!appointment.time) {
        return;
      }

      if (!appointment.capsters || !appointment.capsters.name) {
        return;
      }

      // Create a unique key for grouping (customer_id + time + capster_id + appointment_id for uniqueness)
      const groupKey = `${appointment.customer?.id}_${appointment.time}_${appointment.capsters?.name}_${appointment.id}`;

      // For appointments with same customer, time, and capster, group them together
      const baseGroupKey = `${appointment.customer?.id}_${appointment.time}_${appointment.capsters?.name}`;

      // Find existing group with same base key
      const existingGroup = Object.keys(grouped).find((key) =>
        key.startsWith(baseGroupKey + "_")
      );

      if (existingGroup && grouped[existingGroup]) {
        // Add treatment to existing group
        if (appointment.treatments?.name) {
          grouped[existingGroup].treatments.push(appointment.treatments.name);
        }
      } else {
        // Create new group
        grouped[groupKey] = {
          id: groupKey,
          date: appointment.date,
          time: appointment.time,
          customer: appointment.customer,
          treatments: appointment.treatments?.name
            ? [appointment.treatments.name]
            : [],
          capsters: appointment.capsters,
        };
      }
    });

    return Object.values(grouped);
  }

  const load = useCallback(
    async (date?: Date) => {
      try {
        const targetDate = date || selectedDate;

        // Use local date format to avoid timezone issues
        const year = targetDate.getFullYear();
        const month = String(targetDate.getMonth() + 1).padStart(2, "0");
        const day = String(targetDate.getDate()).padStart(2, "0");
        const dateParam = `${year}-${month}-${day}`;

        const res = await fetch(`/api/appointments?date=${dateParam}`);
        const data = await res.json();

        // Handle both direct array and wrapped responses
        const rawAppointments: Appointment[] = Array.isArray(data)
          ? data
          : data.value || data.data || [];

        const groupedAppointments = groupAppointments(rawAppointments);
        setAppointments(groupedAppointments);
      } catch (error) {
        console.error("Error loading appointments:", error);
        setAppointments([]);
      }
    },
    [selectedDate]
  );

  const handleExport = useCallback(async () => {
    setIsExporting(true);
    try {
      const res = await fetch("/api/export", {
        method: "POST",
      });

      if (res.ok) {
        const data = await res.json();
        console.log("Export successful:", data);
        setExportResult({
          success: true,
          message: `Export berhasil! ${
            data.exported?.length || 0
          } appointment telah dikirim ke Google Sheets.`,
          exportedCount: data.exported?.length || 0,
        });
        setShowExportResult(true);
      } else {
        const errorData = await res.json();
        console.error("Export failed:", errorData);
        setExportResult({
          success: false,
          message: `Export gagal: ${errorData.error || "Unknown error"}`,
        });
        setShowExportResult(true);
      }
    } catch (exportError) {
      console.error("Export error:", exportError);
      setExportResult({
        success: false,
        message:
          "Terjadi kesalahan saat export ke Google Sheets. Periksa console untuk detail.",
      });
      setShowExportResult(true);
    } finally {
      setIsExporting(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  // Initialize time on client-side only and update every second
  useEffect(() => {
    // Set initial time
    setCurrentTime(new Date());

    // Update clock every second
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const todayDate = new Date().toLocaleDateString("id-ID", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="container mx-auto p-3 sm:p-4 lg:p-6 max-w-7xl">
        {/* Header Section */}
        <div className="mb-6 lg:mb-8 items-center">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mb-2">
            <div className="flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 lg:w-24 lg:h-24 overflow-hidden">
              <Image
                src={Logo}
                alt="Nice Barbershop Logo"
                className="w-16 h-16 sm:w-20 sm:h-20 lg:w-24 lg:h-24 object-contain"
              />
            </div>
            <div className="text-center sm:text-right">
              <p className="text-slate-600 font-medium text-sm sm:text-base">
                {todayDate}
              </p>
              <div className="text-2xl sm:text-3xl font-bold text-slate-900 font-mono">
                {currentTime
                  ? currentTime.toLocaleTimeString("id-ID", {
                      hour: "2-digit",
                      minute: "2-digit",
                      second: "2-digit",
                      hour12: false,
                    })
                  : "--:--:--"}
              </div>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6 mb-6 lg:mb-8">
          <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-500 to-blue-600 text-white transform hover:scale-105 transition-all duration-300">
            <CardContent className="p-3 sm:p-4 lg:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100 font-medium text-xs sm:text-sm">
                    Total Customer
                  </p>
                  <p className="text-xl sm:text-2xl lg:text-3xl font-bold">
                    {appointments.length}
                  </p>
                  <p className="text-blue-200 text-xs mt-1">Hari ini</p>
                </div>
                <div className="bg-white/20 p-2 lg:p-3 rounded-xl lg:rounded-2xl">
                  <User className="w-4 h-4 lg:w-6 lg:h-6" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg bg-gradient-to-br from-emerald-500 to-emerald-600 text-white transform hover:scale-105 transition-all duration-300">
            <CardContent className="p-3 sm:p-4 lg:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-emerald-100 font-medium text-xs sm:text-sm">
                    Appointment Terakhir
                  </p>
                  <p className="text-xl sm:text-2xl lg:text-3xl font-bold">
                    {appointments.length > 0
                      ? (() => {
                          // Find appointment with latest time (ascending order)
                          const latestAppointment = appointments
                            .slice()
                            .sort((a, b) => a.time.localeCompare(b.time))
                            .pop();
                          return latestAppointment?.time || "-";
                        })()
                      : "-"}
                  </p>
                  <p className="text-emerald-200 text-xs mt-1 truncate max-w-[100px] sm:max-w-none">
                    {appointments.length > 0
                      ? (() => {
                          // Find appointment with latest time (ascending order)
                          const latestAppointment = appointments
                            .slice()
                            .sort((a, b) => a.time.localeCompare(b.time))
                            .pop();
                          return (
                            latestAppointment?.customer?.name || "Belum ada"
                          );
                        })()
                      : "Belum ada"}
                  </p>
                </div>
                <div className="bg-white/20 p-2 lg:p-3 rounded-xl lg:rounded-2xl">
                  <Clock className="w-4 h-4 lg:w-6 lg:h-6" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg bg-gradient-to-br from-purple-500 to-purple-600 text-white transform hover:scale-105 transition-all duration-300">
            <CardContent className="p-3 sm:p-4 lg:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-100 font-medium text-xs sm:text-sm">
                    Total Treatment
                  </p>
                  <p className="text-xl sm:text-2xl lg:text-3xl font-bold">
                    {appointments.reduce(
                      (total, appointment) =>
                        total + (appointment.treatments?.length || 0),
                      0
                    )}
                  </p>
                  <p className="text-purple-200 text-xs mt-1">
                    Dilakukan hari ini
                  </p>
                </div>
                <div className="bg-white/20 p-2 lg:p-3 rounded-xl lg:rounded-2xl">
                  <Scissors className="w-4 h-4 lg:w-6 lg:h-6" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg bg-gradient-to-br from-amber-500 to-amber-600 text-white transform hover:scale-105 transition-all duration-300">
            <CardContent className="p-3 sm:p-4 lg:p-6">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-amber-100 font-medium text-xs sm:text-sm">
                    Treatment Favorit
                  </p>
                  {(() => {
                    // Calculate most popular treatment
                    const treatmentCounts: { [key: string]: number } = {};
                    appointments.forEach((appointment) => {
                      appointment.treatments?.forEach((treatment) => {
                        treatmentCounts[treatment] =
                          (treatmentCounts[treatment] || 0) + 1;
                      });
                    });

                    const mostPopular = Object.entries(treatmentCounts).sort(
                      ([, a], [, b]) => b - a
                    )[0];

                    if (mostPopular) {
                      return (
                        <>
                          <p className="text-xl sm:text-2xl lg:text-3xl font-bold">
                            {mostPopular[1]}
                          </p>
                          <p className="text-amber-200 text-xs mt-1 truncate max-w-[150px] sm:max-w-none">
                            {mostPopular[0]}
                          </p>
                        </>
                      );
                    } else {
                      return (
                        <>
                          <p className="text-xl font-bold">-</p>
                          <p className="text-amber-200 text-xs mt-1">
                            Belum ada data
                          </p>
                        </>
                      );
                    }
                  })()}
                </div>
                <div className="bg-white/20 p-2 lg:p-3 rounded-xl lg:rounded-2xl">
                  <TrendingUp className="w-4 h-4 lg:w-6 lg:h-6" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Appointments Table */}
        <Card className="border-0 shadow-xl bg-white">
          <CardHeader className="pb-4">
            <CardTitle className="text-xl lg:text-2xl font-bold text-slate-900 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
              <div className="flex items-center justify-between gap-3">
                <div className="bg-gradient-to-br from-blue-100 to-blue-200 p-2 rounded-xl">
                  <Scissors className="w-4 h-4 lg:w-5 lg:h-5 text-blue-700" />
                </div>
                <div className="flex justify-between items-center">
                  <div className="flex flex-col">
                    <div>Appointment</div>
                    <div className="text-sm font-normal text-slate-600">
                      {selectedDate.toLocaleDateString("id-ID", {
                        weekday: "long",
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                      })}
                    </div>
                  </div>
                  <div className="lg:hidden block">
                    <button
                      onClick={() => load()}
                      className="p-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors"
                      title="Reload data"
                    >
                      <RefreshCw className="w-3 h-3 sm:w-4 sm:h-4" />
                    </button>
                  </div>
                </div>
              </div>

              <div className="w-full lg:w-auto flex flex-col md:flex-row gap-3 md:items-center">
                {/* Date Picker */}
                <div className="flex items-center gap-2 sm:gap-3 bg-slate-50 px-2 sm:px-3 py-2 rounded-lg border border-slate-200">
                  <Calendar className="w-4 h-4 text-blue-600 flex-shrink-0" />
                  <Label className="text-xs sm:text-sm font-medium text-slate-700 whitespace-nowrap">
                    Pilih Tanggal
                  </Label>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const yesterday = new Date(selectedDate);
                        yesterday.setDate(yesterday.getDate() - 1);
                        setSelectedDate(yesterday);
                        load(yesterday);
                      }}
                      className="h-7 w-7 p-0 text-xs"
                      title="Hari sebelumnya"
                    >
                      <ChevronLeft className="w-3 h-3" />
                    </Button>
                    <DatePicker
                      selected={selectedDate}
                      onChange={(date: Date | null) => {
                        if (date) {
                          setSelectedDate(date);
                          load(date);
                        }
                      }}
                      dateFormat="dd/MM/yyyy"
                      className="p-1 sm:p-2 border border-slate-200 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-xs sm:text-sm w-20 sm:w-24 bg-white text-center"
                      maxDate={new Date()}
                      placeholderText="Pilih tanggal"
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const tomorrow = new Date(selectedDate);
                        tomorrow.setDate(tomorrow.getDate() + 1);
                        if (tomorrow <= new Date()) {
                          setSelectedDate(tomorrow);
                          load(tomorrow);
                        }
                      }}
                      disabled={
                        selectedDate.toDateString() ===
                        new Date().toDateString()
                      }
                      className="h-7 w-7 p-0 text-xs"
                      title="Hari berikutnya"
                    >
                      <ChevronRight className="w-3 h-3" />
                    </Button>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="w-full lg:w-auto flex flex-col md:flex-row gap-3 md:items-center">
                  {/* Export Button */}
                  <Button
                    onClick={handleExport}
                    variant="outline"
                    size="sm"
                    disabled={isExporting}
                    className="border-green-200 text-green-700 hover:bg-green-50 hover:border-green-300 shadow-sm font-semibold text-xs sm:text-sm"
                  >
                    {isExporting ? (
                      <Loader2 className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2 animate-spin" />
                    ) : (
                      <Download className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                    )}
                    <span className="hidden sm:inline">Export to Sheets</span>
                    <span className="sm:hidden">Export</span>
                  </Button>

                  <Dialog open={showAdd} onOpenChange={setShowAdd}>
                    <DialogTrigger asChild>
                      <Button
                        size="sm"
                        className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white border-0 shadow-lg px-3 sm:px-4 py-2 text-xs sm:text-sm font-semibold rounded-lg transform hover:scale-105 transition-all duration-200"
                      >
                        <Plus className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                        <span className="hidden sm:inline">
                          Tambah Appointment
                        </span>
                        <span className="sm:hidden">Tambah</span>
                      </Button>
                    </DialogTrigger>
                    <AddAppointmentModal
                      onClose={() => {
                        setShowAdd(false);
                        load();
                      }}
                    />
                  </Dialog>

                  {/* Export Result Modal */}
                  <Dialog
                    open={showExportResult}
                    onOpenChange={setShowExportResult}
                  >
                    <DialogContent className="sm:max-w-md max-w-[95vw] mx-4">
                      <DialogHeader>
                        <DialogTitle className="text-lg sm:text-xl font-bold text-slate-900 flex items-center gap-3">
                          <div
                            className={`p-2 rounded-xl ${
                              exportResult?.success
                                ? "bg-green-100"
                                : "bg-red-100"
                            }`}
                          >
                            {exportResult?.success ? (
                              <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-green-700" />
                            ) : (
                              <XCircle className="w-4 h-4 sm:w-5 sm:h-5 text-red-700" />
                            )}
                          </div>
                          <span className="text-base sm:text-lg">
                            {exportResult?.success
                              ? "Export Berhasil"
                              : "Export Gagal"}
                          </span>
                        </DialogTitle>
                      </DialogHeader>

                      <div className="py-4">
                        <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
                          {exportResult?.message}
                        </p>
                        {exportResult?.success &&
                          exportResult?.exportedCount !== undefined && (
                            <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                              <div className="flex items-center gap-2">
                                <div className="bg-green-100 p-1.5 rounded-md">
                                  <User className="w-3.5 h-3.5 text-green-600" />
                                </div>
                                <span className="text-sm font-medium text-green-900">
                                  {exportResult.exportedCount} appointment
                                  berhasil diekspor
                                </span>
                              </div>
                            </div>
                          )}
                      </div>

                      <DialogFooter>
                        <Button
                          onClick={() => setShowExportResult(false)}
                          className={`w-full sm:w-auto ${
                            exportResult?.success
                              ? "bg-green-600 hover:bg-green-700"
                              : "bg-red-600 hover:bg-red-700"
                          } text-white`}
                        >
                          Tutup
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                  <button
                    onClick={() => load()}
                    className="p-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors hidden lg:block"
                    title="Reload data"
                  >
                    <RefreshCw className="w-3 h-3 sm:w-4 sm:h-4" />
                  </button>
                </div>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <AppointmentTable items={appointments} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function AppointmentTable({ items }: { items: GroupedAppointment[] }) {
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Calculate pagination
  const totalPages = Math.ceil(items.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentItems = items.slice(startIndex, endIndex);

  // Reset to page 1 when items change
  useEffect(() => {
    setCurrentPage(1);
  }, [items]);

  if (items.length === 0) {
    return (
      <div className="text-center py-8 sm:py-12">
        <div className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-4 bg-slate-100 rounded-full flex items-center justify-center">
          <Scissors className="w-6 h-6 sm:w-8 sm:h-8 text-slate-400" />
        </div>
        <p className="text-base sm:text-lg font-medium text-slate-600 mb-2">
          Belum ada appointment hari ini
        </p>
        <p className="text-sm sm:text-base text-slate-500">
          Tambahkan appointment pertama untuk memulai
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Table - Responsive design */}
      <div className="rounded-xl border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50 hover:bg-slate-50">
                <TableHead className="font-semibold text-slate-700 min-w-[100px]">
                  Waktu
                </TableHead>
                <TableHead className="font-semibold text-slate-700 min-w-[120px]">
                  Customer
                </TableHead>
                <TableHead className="font-semibold text-slate-700 min-w-[120px] hidden sm:table-cell">
                  Whatsapp
                </TableHead>
                <TableHead className="font-semibold text-slate-700 min-w-[150px]">
                  Treatment
                </TableHead>
                <TableHead className="font-semibold text-slate-700 min-w-[100px] hidden md:table-cell">
                  Capster
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {currentItems.map((appointment, index) => (
                <TableRow
                  key={appointment.id}
                  className={`hover:bg-slate-50 transition-colors ${
                    index % 2 === 0 ? "bg-white" : "bg-slate-25"
                  }`}
                >
                  <TableCell className="font-semibold text-slate-900">
                    <div className="flex items-center gap-2">
                      <div className="bg-blue-100 p-1.5 rounded-md">
                        <Clock className="w-3.5 h-3.5 text-blue-600" />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-xs sm:text-sm font-light">
                          {appointment.date}
                        </span>
                        <span className="text-sm sm:text-base">
                          {appointment.time}
                        </span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="font-medium text-slate-900">
                    <div className="flex items-center gap-2">
                      <div className="bg-emerald-100 p-1.5 rounded-md">
                        <User className="w-3.5 h-3.5 text-emerald-600" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm sm:text-base font-medium truncate">
                          {appointment.customer?.name ?? "-"}
                        </p>
                        <p className="text-xs text-slate-600 sm:hidden truncate">
                          {appointment.customer?.whatsapp ?? "-"}
                        </p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-slate-600 hidden sm:table-cell">
                    <div className="flex items-center gap-2">
                      <div className="bg-purple-100 p-1.5 rounded-md">
                        <Phone className="w-3.5 h-3.5 text-purple-600" />
                      </div>
                      <span className="text-sm">
                        {appointment.customer?.whatsapp ?? "-"}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="text-slate-600">
                    <div className="flex items-center gap-2">
                      <div className="bg-amber-100 p-1.5 rounded-md mt-0.5">
                        <Scissors className="w-3.5 h-3.5 text-amber-600" />
                      </div>
                      <div className="flex flex-wrap gap-1 min-w-0 flex-1">
                        {appointment.treatments &&
                        appointment.treatments.length > 0
                          ? appointment.treatments.map((treatment, idx) => (
                              <span
                                key={idx}
                                className="bg-amber-50 text-amber-700 border border-amber-200 px-2 py-0.5 rounded-md text-xs font-medium truncate max-w-[120px] sm:max-w-none"
                                title={treatment}
                              >
                                {treatment}
                              </span>
                            ))
                          : "-"}
                      </div>
                    </div>
                    {/* Show capster in mobile when capster column is hidden */}
                    <div className="md:hidden mt-2 flex items-center gap-2">
                      <div className="bg-indigo-100 p-1 rounded">
                        <User className="w-3 h-3 text-indigo-600" />
                      </div>
                      <span className="text-xs text-slate-600">
                        {appointment.capsters?.name ?? "-"}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="text-slate-600 hidden md:table-cell">
                    <div className="flex items-center gap-2">
                      <div className="bg-indigo-100 p-1.5 rounded-md">
                        <User className="w-3.5 h-3.5 text-indigo-600" />
                      </div>
                      <span className="text-sm">
                        {appointment.capsters?.name ?? "-"}
                      </span>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between px-2">
          <div className="text-sm text-slate-600">
            Menampilkan {startIndex + 1}-{Math.min(endIndex, items.length)} dari{" "}
            {items.length} appointment
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="h-8 w-8 p-0"
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>

            <div className="flex items-center gap-1">
              {/* Page numbers */}
              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter((page) => {
                  // Show current page, first page, last page, and 1 page before/after current
                  return (
                    page === 1 ||
                    page === totalPages ||
                    Math.abs(page - currentPage) <= 1
                  );
                })
                .map((page, index, array) => {
                  const showEllipsis = index > 0 && page - array[index - 1] > 1;
                  return (
                    <div key={page} className="flex items-center gap-1">
                      {showEllipsis && (
                        <span className="px-2 py-1 text-sm text-slate-400">
                          ...
                        </span>
                      )}
                      <Button
                        variant={currentPage === page ? "default" : "outline"}
                        size="sm"
                        onClick={() => setCurrentPage(page)}
                        className="h-8 w-8 p-0 text-sm"
                      >
                        {page}
                      </Button>
                    </div>
                  );
                })}
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                setCurrentPage((prev) => Math.min(prev + 1, totalPages))
              }
              disabled={currentPage === totalPages}
              className="h-8 w-8 p-0"
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

function AddAppointmentModal({ onClose }: { onClose: () => void }) {
  const [capsters, setCapsters] = useState<{ id: number; name: string }[]>([]);
  const [treatments, setTreatments] = useState<{ id: number; name: string }[]>(
    []
  );
  const [selectedCapster, setSelectedCapster] = useState<string>("");
  const [selectedTreatments, setSelectedTreatments] = useState<string[]>([]);
  const [customerQuery, setCustomerQuery] = useState("");
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(
    null
  );
  const [addingCustomer, setAddingCustomer] = useState(false);
  const [newCustomerName, setNewCustomerName] = useState("");
  const [newCustomerWhatsapp, setNewCustomerWhatsapp] = useState("");
  const [loadingCustomers, setLoadingCustomers] = useState(false);
  const [customerValidationError, setCustomerValidationError] = useState("");

  // Enhanced close function that resets form
  const handleClose = () => {
    // Reset all form state
    setSelectedCapster("");
    setSelectedTreatments([]);
    setCustomerQuery("");
    setCustomers([]);
    setSelectedCustomer(null);
    setAddingCustomer(false);
    setNewCustomerName("");
    setNewCustomerWhatsapp("");
    setCustomerValidationError("");
    onClose();
  };

  useEffect(() => {
    fetch("/api/masters")
      .then((r) => r.json())
      .then((d) => {
        setTreatments(d.treatments || []);
        setCapsters(d.capsters || []);
      });
  }, []);

  useEffect(() => {
    if (!customerQuery) {
      setCustomers([]);
      setLoadingCustomers(false);
      return;
    }

    setLoadingCustomers(true);
    const t = setTimeout(() => {
      fetch(`/api/customers?q=${encodeURIComponent(customerQuery)}`)
        .then((r) => r.json())
        .then((d) => {
          setCustomers(d || []);
          setLoadingCustomers(false);
        })
        .catch(() => {
          setCustomers([]);
          setLoadingCustomers(false);
        });
    }, 250);
    return () => clearTimeout(t);
  }, [customerQuery]);

  async function handleAddCustomer() {
    if (!newCustomerName.trim() || !newCustomerWhatsapp.trim()) return;

    // Reset validation error
    setCustomerValidationError("");

    // Check if customer already exists
    try {
      const checkRes = await fetch(
        `/api/customers?q=${encodeURIComponent(newCustomerWhatsapp)}`
      );
      const existingCustomers = await checkRes.json();

      // Check for duplicate whatsapp only (this is what we want to prevent)
      const duplicateWhatsApp = existingCustomers.find(
        (customer: Customer) => customer.whatsapp === newCustomerWhatsapp
      );

      if (duplicateWhatsApp) {
        setCustomerValidationError(
          `Nomor WhatsApp "${newCustomerWhatsapp}" sudah digunakan oleh customer "${duplicateWhatsApp.name}". Gunakan nomor yang berbeda.`
        );
        return;
      }

      // If no duplicates, proceed with creation
      const res = await fetch("/api/customers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newCustomerName,
          whatsapp: newCustomerWhatsapp,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setSelectedCustomer(data);
        setAddingCustomer(false);
        setNewCustomerName("");
        setNewCustomerWhatsapp("");
        setCustomerValidationError("");
      } else {
        setCustomerValidationError(
          "Gagal menambahkan customer. Silakan coba lagi."
        );
      }
    } catch {
      setCustomerValidationError(
        "Terjadi kesalahan saat memvalidasi customer. Silakan coba lagi."
      );
    }
  }

  async function handleSubmit() {
    if (
      !selectedCustomer?.id ||
      selectedTreatments.length === 0 ||
      !selectedCapster
    )
      return;

    // Create multiple appointments, one for each selected treatment
    const appointmentPromises = selectedTreatments.map((treatmentId) =>
      fetch("/api/appointments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customer_id: selectedCustomer.id,
          treatment_id: Number(treatmentId),
          capster_id: Number(selectedCapster),
        }),
      })
    );

    await Promise.all(appointmentPromises);
    handleClose();
  }

  return (
    <DialogContent className="sm:max-w-2xl max-w-[95vw] w-full max-h-[95vh] overflow-y-auto z-50 sm:mx-auto">
      <DialogHeader>
        <DialogTitle className="text-xl sm:text-2xl font-bold text-slate-900 flex items-center gap-3">
          <div className="bg-gradient-to-br from-blue-100 to-blue-200 p-2 rounded-xl">
            <Plus className="w-4 h-4 sm:w-5 sm:h-5 text-blue-700" />
          </div>
          <span className="text-base sm:text-xl">Tambah Appointment Baru</span>
        </DialogTitle>
        <DialogDescription className="text-sm sm:text-base text-slate-600">
          Masukkan detail appointment untuk pelanggan baru
        </DialogDescription>
      </DialogHeader>

      <div className="space-y-4 sm:space-y-6 py-4">
        {/* Capster Selection */}
        <div className="space-y-2">
          <Label
            htmlFor="capster"
            className="text-sm font-semibold text-slate-700"
          >
            Pilih Capster
          </Label>
          <Select
            value={
              capsters.find((c) => c.id.toString() === selectedCapster)
                ? {
                    value: selectedCapster,
                    label: capsters.find(
                      (c) => c.id.toString() === selectedCapster
                    )?.name,
                  }
                : null
            }
            onChange={(option) => setSelectedCapster(option?.value || "")}
            options={capsters.map((capster) => ({
              value: capster.id.toString(),
              label: capster.name,
            }))}
            placeholder=""
            isSearchable
            className="react-select-container"
            classNamePrefix="react-select"
            styles={{
              menuPortal: (provided) => ({
                ...provided,
                zIndex: 9999,
              }),
              menu: (provided) => ({
                ...provided,
                zIndex: 9999,
                fontSize: "16px",
              }),
              control: (provided) => ({
                ...provided,
                minHeight: "48px",
                fontSize: "16px",
              }),
            }}
            menuPortalTarget={null}
          />
        </div>

        {/* Customer Selection */}
        <div className="space-y-4">
          <Label className="text-sm font-semibold text-slate-700">
            Customer
          </Label>

          {!addingCustomer ? (
            <div className="space-y-4">
              <Select
                value={
                  selectedCustomer
                    ? {
                        value: selectedCustomer.id.toString(),
                        label: `${selectedCustomer.name} (${selectedCustomer.whatsapp})`,
                      }
                    : null
                }
                onChange={(option) => {
                  if (option) {
                    const customer = customers.find(
                      (c) => c.id.toString() === option.value
                    );
                    if (customer) {
                      setSelectedCustomer(customer);
                    }
                  } else {
                    setSelectedCustomer(null);
                  }
                }}
                onInputChange={(inputValue) => setCustomerQuery(inputValue)}
                options={customers.map((customer) => ({
                  value: customer.id.toString(),
                  label: `${customer.name} (${customer.whatsapp})`,
                }))}
                placeholder=""
                isSearchable
                isClearable
                isLoading={loadingCustomers}
                className="react-select-container"
                classNamePrefix="react-select"
                styles={{
                  menuPortal: (provided) => ({
                    ...provided,
                    zIndex: 9999,
                  }),
                  menu: (provided) => ({
                    ...provided,
                    zIndex: 9999,
                    fontSize: "16px",
                  }),
                  control: (provided) => ({
                    ...provided,
                    minHeight: "48px",
                    fontSize: "16px",
                  }),
                }}
                menuPortalTarget={null}
                noOptionsMessage={({ inputValue }) =>
                  inputValue
                    ? `Tidak ditemukan "${inputValue}"`
                    : "Cari customer"
                }
              />

              {selectedCustomer && (
                <Card className="border-green-200 bg-green-50">
                  <CardContent className="p-3 sm:p-4">
                    <div className="flex items-center gap-3">
                      <div className="bg-green-100 p-2 rounded-full">
                        <User className="w-4 h-4 text-green-700" />
                      </div>
                      <div>
                        <p className="font-semibold text-green-900 text-sm sm:text-base">
                          {selectedCustomer.name}
                        </p>
                        <p className="text-xs sm:text-sm text-green-700">
                          {selectedCustomer.whatsapp}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              <div className="flex flex-col sm:flex-row gap-3">
                <Button
                  variant="outline"
                  onClick={() => setAddingCustomer(true)}
                  className="flex items-center justify-center gap-2 text-base h-12 min-h-[48px]"
                >
                  <Plus className="w-4 h-4" />
                  Tambah Customer Baru
                </Button>
                {selectedCustomer && (
                  <Button
                    variant="outline"
                    onClick={() => setSelectedCustomer(null)}
                    className="text-base h-12 min-h-[48px]"
                  >
                    Reset Pilihan
                  </Button>
                )}
              </div>
            </div>
          ) : (
            <Card className="border-blue-200 bg-blue-50">
              <CardContent className="p-3 sm:p-4 space-y-4">
                {/* Validation Error Display */}
                {customerValidationError && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-xs sm:text-sm text-red-700 font-medium">
                      {customerValidationError}
                    </p>
                  </div>
                )}

                <div className="space-y-2">
                  <Label
                    htmlFor="customer-name"
                    className="text-sm font-medium text-blue-900"
                  >
                    Nama Customer
                  </Label>
                  <Input
                    id="customer-name"
                    placeholder="Masukkan nama lengkap"
                    value={newCustomerName}
                    onChange={(e) => {
                      setNewCustomerName(e.target.value);
                      if (customerValidationError)
                        setCustomerValidationError("");
                    }}
                    className="bg-white text-base h-12 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    autoComplete="given-name"
                  />
                </div>
                <div className="space-y-2">
                  <Label
                    htmlFor="customer-whatsapp"
                    className="text-sm font-medium text-blue-900"
                  >
                    Nomor Whatsapp
                  </Label>
                  <Input
                    id="customer-whatsapp"
                    placeholder="08xxxxxxxxxx"
                    value={newCustomerWhatsapp}
                    onChange={(e) => {
                      setNewCustomerWhatsapp(e.target.value);
                      if (customerValidationError)
                        setCustomerValidationError("");
                    }}
                    className="bg-white text-base h-12 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    type="tel"
                    autoComplete="tel"
                    inputMode="numeric"
                  />
                </div>
                <div className="flex flex-col sm:flex-row gap-3">
                  <Button
                    onClick={handleAddCustomer}
                    disabled={
                      !newCustomerName.trim() || !newCustomerWhatsapp.trim()
                    }
                    className="bg-blue-600 hover:bg-blue-700 text-base h-12 min-h-[48px]"
                  >
                    Simpan Customer
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setAddingCustomer(false);
                      setNewCustomerName("");
                      setNewCustomerWhatsapp("");
                      setCustomerValidationError("");
                    }}
                    className="text-base h-12 min-h-[48px]"
                  >
                    Batal
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Treatment Selection */}
        <div className="space-y-2">
          <Label
            htmlFor="treatment"
            className="text-sm font-semibold text-slate-700"
          >
            Pilih Treatment
          </Label>
          <Select
            value={selectedTreatments
              .map((treatmentId) => {
                const treatment = treatments.find(
                  (t) => t.id.toString() === treatmentId
                );
                return treatment
                  ? {
                      value: treatmentId,
                      label: treatment.name,
                    }
                  : null;
              })
              .filter(Boolean)}
            onChange={(selectedOptions) => {
              const values = selectedOptions
                ? selectedOptions
                    .map((option) => option?.value)
                    .filter((value): value is string => Boolean(value))
                : [];
              setSelectedTreatments(values);
            }}
            options={treatments.map((treatment) => ({
              value: treatment.id.toString(),
              label: treatment.name,
            }))}
            placeholder=""
            isSearchable
            isMulti
            menuPlacement="auto"
            maxMenuHeight={300}
            menuPortalTarget={null}
            filterOption={(candidate, input) => {
              // Always show all options, no filtering limit
              if (!input) return true;
              return candidate.label
                .toLowerCase()
                .includes(input.toLowerCase());
            }}
            className="react-select-container"
            classNamePrefix="react-select"
            styles={{
              menuPortal: (provided) => ({
                ...provided,
                zIndex: 9999,
              }),
              menu: (provided) => ({
                ...provided,
                zIndex: 9999,
                fontSize: "16px",
              }),
              control: (provided) => ({
                ...provided,
                minHeight: "48px",
                fontSize: "16px",
              }),
            }}
          />
        </div>
      </div>

      <DialogFooter className="gap-3 pt-4">
        <Button
          variant="outline"
          onClick={handleClose}
          className="text-base h-12 min-h-[48px] flex-1 sm:flex-none"
        >
          Batal
        </Button>
        <Button
          onClick={handleSubmit}
          disabled={
            !selectedCustomer?.id ||
            selectedTreatments.length === 0 ||
            !selectedCapster
          }
          className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-base h-12 min-h-[48px] flex-1 sm:flex-none"
        >
          Simpan Appointment
        </Button>
      </DialogFooter>
    </DialogContent>
  );
}
