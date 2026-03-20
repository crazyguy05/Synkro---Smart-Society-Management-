"use client";
import { useEffect, useMemo, useState } from "react";
import Shell from "../../../components/Shell";
import { api } from "../../../lib/api";
import { useAuth } from "../../../lib/auth";

type Resident = {
  _id: string;
  name: string;
  email: string;
  apartment?: string;
};

const inr = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});

export default function MaintenanceCalculatorPage() {
  const { user } = useAuth();
  const [residents, setResidents] = useState<Resident[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [billId, setBillId] = useState<string | null>(null);

  const [form, setForm] = useState({
    residentId: "",
    residentEmail: "",
    flatNumber: "",
    monthLabel: new Date().toLocaleString("en-US", { month: "long", year: "numeric" }),
    dueDate: "",
    flatSizeSqft: "1200",
    parkingSlots: "1",
    gym: true,
    pool: false,
    clubhouse: true,
    cctv: true,
    waterRate: "1200",
    securityRate: "1600",
    liftRate: "900",
    commonRate: "800",
    perSqftRate: "2.5",
    parkingRate: "600",
    notes: "",
  });

  useEffect(() => {
    if (user?.role !== "admin") return;
    const loadResidents = async () => {
      try {
        const list = await api("/api/auth/users?role=resident");
        setResidents(Array.isArray(list) ? list : []);
      } catch {
        setResidents([]);
      }
    };
    loadResidents();
  }, [user]);

  const calc = useMemo(() => {
    const flatSize = Number(form.flatSizeSqft) || 0;
    const parkingSlots = Number(form.parkingSlots) || 0;
    const perSqftRate = Number(form.perSqftRate) || 0;
    const parkingRate = Number(form.parkingRate) || 0;
    const water = Number(form.waterRate) || 0;
    const security = Number(form.securityRate) || 0;
    const lift = Number(form.liftRate) || 0;
    const common = Number(form.commonRate) || 0;

    const sizeCharge = flatSize * perSqftRate;
    const parkingCharge = parkingSlots * parkingRate;
    const amenitiesCharge =
      (form.gym ? 500 : 0) +
      (form.pool ? 700 : 0) +
      (form.clubhouse ? 400 : 0) +
      (form.cctv ? 300 : 0);

    const subtotal = sizeCharge + parkingCharge + amenitiesCharge + water + security + lift + common;
    const serviceFee = Math.round(subtotal * 0.02);
    const total = subtotal + serviceFee;

    return {
      sizeCharge,
      parkingCharge,
      amenitiesCharge,
      water,
      security,
      lift,
      common,
      serviceFee,
      total,
    };
  }, [form]);

  const selectedResident = residents.find((r) => r._id === form.residentId);

  const generateBill = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    setBillId(null);
    try {
      const payload = {
        residentId: form.residentId || undefined,
        residentEmail: form.residentId ? undefined : form.residentEmail || undefined,
        flatNumber: form.flatNumber || selectedResident?.apartment || undefined,
        category: "Maintenance",
        description: [
          `Monthly Maintenance (${form.monthLabel})`,
          `Flat size: ${form.flatSizeSqft} sq ft`,
          `Parking slots: ${form.parkingSlots}`,
          `Amenities: ${[
            form.gym ? "Gym" : "",
            form.pool ? "Pool" : "",
            form.clubhouse ? "Clubhouse" : "",
            form.cctv ? "CCTV" : "",
          ]
            .filter(Boolean)
            .join(", ") || "None"}`,
          `Breakdown -> Water:${calc.water}, Security:${calc.security}, Lift:${calc.lift}, Common:${calc.common}`,
          form.notes ? `Notes: ${form.notes}` : "",
        ]
          .filter(Boolean)
          .join(" | "),
        amount: Math.round(calc.total),
        issueDate: new Date().toISOString(),
        dueDate: form.dueDate || undefined,
      };

      const res = await api("/api/billing/new", {
        method: "POST",
        body: JSON.stringify(payload),
      });

      setBillId(res?.billId || res?._id || null);
      setMessage("Bill generated successfully.");
    } catch (err: any) {
      const text = typeof err?.message === "string" ? err.message : "";
      setMessage(text || "Failed to generate bill.");
    } finally {
      setLoading(false);
    }
  };

  const sendReminderDemo = () => {
    setMessage("Reminder queued (demo). Hook this to SMS/WhatsApp/Email API.");
  };

  const openPaymentDemo = () => {
    setMessage("Payment integration placeholder (Razorpay/UPI) ready for wiring.");
  };

  if (user?.role !== "admin") {
    return (
      <Shell>
        <div className="p-6">Only admins can access the maintenance calculator.</div>
      </Shell>
    );
  }

  return (
    <Shell>
      <div className="grid gap-6">
        <div className="card p-4">
          <h2 className="text-lg font-semibold">Maintenance Calculator</h2>
          <p className="text-sm opacity-75">
            Admin-only finance engine for monthly maintenance calculation, bill generation, reminders, and invoice flow.
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-4">
          <form onSubmit={generateBill} className="card p-4 grid gap-3 lg:col-span-2">
            <h3 className="font-medium">1) Calculation Inputs</h3>

            <div className="grid md:grid-cols-2 gap-3">
              <select
                className="px-3 py-2 rounded bg-white/5 border border-white/10"
                value={form.residentId}
                onChange={(e) =>
                  setForm((v) => ({
                    ...v,
                    residentId: e.target.value,
                    residentEmail: "",
                    flatNumber: residents.find((r) => r._id === e.target.value)?.apartment || v.flatNumber,
                  }))
                }
              >
                <option value="">Select Resident (recommended)</option>
                {residents.map((r) => (
                  <option key={r._id} value={r._id}>
                    {r.name} ({r.email})
                  </option>
                ))}
              </select>
              <input
                className="px-3 py-2 rounded bg-white/5 border border-white/10"
                placeholder="Resident Email (if not selected)"
                value={form.residentEmail}
                onChange={(e) => setForm((v) => ({ ...v, residentEmail: e.target.value, residentId: "" }))}
              />
            </div>

            <div className="grid md:grid-cols-3 gap-3">
              <input
                className="px-3 py-2 rounded bg-white/5 border border-white/10"
                placeholder="Flat Number"
                value={form.flatNumber}
                onChange={(e) => setForm((v) => ({ ...v, flatNumber: e.target.value }))}
              />
              <input
                className="px-3 py-2 rounded bg-white/5 border border-white/10"
                placeholder="Month Label (e.g. March 2026)"
                value={form.monthLabel}
                onChange={(e) => setForm((v) => ({ ...v, monthLabel: e.target.value }))}
              />
              <input
                type="date"
                className="px-3 py-2 rounded bg-white/5 border border-white/10"
                value={form.dueDate}
                onChange={(e) => setForm((v) => ({ ...v, dueDate: e.target.value }))}
              />
            </div>

            <div className="grid md:grid-cols-4 gap-3">
              <input
                type="number"
                className="px-3 py-2 rounded bg-white/5 border border-white/10"
                placeholder="Flat Size (sq ft)"
                value={form.flatSizeSqft}
                onChange={(e) => setForm((v) => ({ ...v, flatSizeSqft: e.target.value }))}
              />
              <input
                type="number"
                className="px-3 py-2 rounded bg-white/5 border border-white/10"
                placeholder="Per sq ft rate"
                value={form.perSqftRate}
                onChange={(e) => setForm((v) => ({ ...v, perSqftRate: e.target.value }))}
              />
              <input
                type="number"
                className="px-3 py-2 rounded bg-white/5 border border-white/10"
                placeholder="Parking Slots"
                value={form.parkingSlots}
                onChange={(e) => setForm((v) => ({ ...v, parkingSlots: e.target.value }))}
              />
              <input
                type="number"
                className="px-3 py-2 rounded bg-white/5 border border-white/10"
                placeholder="Per parking rate"
                value={form.parkingRate}
                onChange={(e) => setForm((v) => ({ ...v, parkingRate: e.target.value }))}
              />
            </div>

            <div className="grid md:grid-cols-4 gap-3 text-sm">
              {[
                { key: "gym", label: "Gym" },
                { key: "pool", label: "Pool" },
                { key: "clubhouse", label: "Clubhouse" },
                { key: "cctv", label: "CCTV" },
              ].map((a) => (
                <label key={a.key} className="flex items-center gap-2 px-3 py-2 rounded border border-white/10 bg-white/5">
                  <input
                    type="checkbox"
                    checked={(form as any)[a.key]}
                    onChange={(e) => setForm((v) => ({ ...v, [a.key]: e.target.checked }))}
                    className="accent-orange-500"
                  />
                  <span>{a.label}</span>
                </label>
              ))}
            </div>

            <h3 className="font-medium mt-2">2) Expense Breakdown Inputs</h3>
            <div className="grid md:grid-cols-4 gap-3">
              <input type="number" className="px-3 py-2 rounded bg-white/5 border border-white/10" placeholder="Water" value={form.waterRate} onChange={(e) => setForm((v) => ({ ...v, waterRate: e.target.value }))} />
              <input type="number" className="px-3 py-2 rounded bg-white/5 border border-white/10" placeholder="Security" value={form.securityRate} onChange={(e) => setForm((v) => ({ ...v, securityRate: e.target.value }))} />
              <input type="number" className="px-3 py-2 rounded bg-white/5 border border-white/10" placeholder="Lift" value={form.liftRate} onChange={(e) => setForm((v) => ({ ...v, liftRate: e.target.value }))} />
              <input type="number" className="px-3 py-2 rounded bg-white/5 border border-white/10" placeholder="Common" value={form.commonRate} onChange={(e) => setForm((v) => ({ ...v, commonRate: e.target.value }))} />
            </div>

            <textarea
              className="px-3 py-2 rounded bg-white/5 border border-white/10 min-h-[80px]"
              placeholder="Notes (optional)"
              value={form.notes}
              onChange={(e) => setForm((v) => ({ ...v, notes: e.target.value }))}
            />

            <div className="flex flex-wrap gap-2">
              <button
                className="btn-glow px-4 py-2 rounded"
                disabled={loading || (!form.residentId && !form.residentEmail)}
              >
                {loading ? "Generating..." : "Generate Monthly Bill"}
              </button>
              <button type="button" onClick={() => window.print()} className="px-4 py-2 rounded border border-white/10 bg-white/5 hover:bg-white/10">
                Download Invoice (PDF)
              </button>
              <button type="button" onClick={openPaymentDemo} className="px-4 py-2 rounded border border-white/10 bg-white/5 hover:bg-white/10">
                Payment Integration
              </button>
              <button type="button" onClick={sendReminderDemo} className="px-4 py-2 rounded border border-white/10 bg-white/5 hover:bg-white/10">
                Send Reminder
              </button>
            </div>
          </form>

          <div className="card p-4 space-y-3">
            <h3 className="font-medium">Invoice Preview</h3>
            <div className="text-sm space-y-1">
              <div className="flex justify-between"><span className="opacity-80">Flat-size charge</span><span>{inr.format(calc.sizeCharge)}</span></div>
              <div className="flex justify-between"><span className="opacity-80">Parking charge</span><span>{inr.format(calc.parkingCharge)}</span></div>
              <div className="flex justify-between"><span className="opacity-80">Amenities charge</span><span>{inr.format(calc.amenitiesCharge)}</span></div>
              <div className="flex justify-between"><span className="opacity-80">Water</span><span>{inr.format(calc.water)}</span></div>
              <div className="flex justify-between"><span className="opacity-80">Security</span><span>{inr.format(calc.security)}</span></div>
              <div className="flex justify-between"><span className="opacity-80">Lift</span><span>{inr.format(calc.lift)}</span></div>
              <div className="flex justify-between"><span className="opacity-80">Common</span><span>{inr.format(calc.common)}</span></div>
              <div className="flex justify-between"><span className="opacity-80">Service fee (2%)</span><span>{inr.format(calc.serviceFee)}</span></div>
              <hr className="border-white/10 my-2" />
              <div className="flex justify-between font-semibold text-base"><span>Total</span><span>{inr.format(calc.total)}</span></div>
            </div>

            <div className="text-xs opacity-75 pt-2 border-t border-white/10">
              <p>Generated for: {selectedResident?.name || form.residentEmail || "Not selected"}</p>
              <p>Month: {form.monthLabel}</p>
              <p>Due date: {form.dueDate || "Not set"}</p>
              {billId && <p className="text-emerald-300 mt-1">Created bill: {billId}</p>}
            </div>
          </div>
        </div>

        {message && (
          <div className="card p-4">
            <p className="text-sm">{message}</p>
          </div>
        )}
      </div>
    </Shell>
  );
}

