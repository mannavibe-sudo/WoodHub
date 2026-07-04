// Field definitions for WoodHub forms & tables.
// Keeping this as one shared source of truth so the entry form,
// the history table, and CSV export all agree with each other.

const LOG_ENTRY_SECTIONS = [
  {
    title: "Trip & Transport",
    fields: [
      { key: "truck_number", label: "Truck Number", type: "text", required: true },
      { key: "transporter_name", label: "Transporter Name", type: "text" },
      { key: "transporter_mobile", label: "Transporter Mobile", type: "tel" },
      { key: "driver_mobile", label: "Driver Mobile", type: "tel" },
      { key: "lorry_receipt", label: "Lorry Receipt (LR) No.", type: "text" },
      { key: "truck_capacity_mt", label: "Capacity of Truck (MT)", type: "number", step: "0.01" },
      { key: "truck_length", label: "Length of Truck (ft)", type: "number", step: "0.01" },
      { key: "loading_location", label: "Loading Location", type: "text" },
      { key: "delivery_chalan", label: "Delivery Chalan", type: "text" },
    ],
  },
  {
    title: "Dispatch & Weight",
    fields: [
      { key: "dispatch_date", label: "Date of Dispatch", type: "date" },
      { key: "reached_on", label: "Reached On", type: "date" },
      { key: "wc_number", label: "WC Number", type: "text" },
      { key: "eway_bill_no", label: "E-Way Bill No.", type: "text" },
      { key: "weight_pi_yard_mt", label: "Weight at PI Yard (MT)", type: "number", step: "0.001" },
      { key: "weight_itc_yard", label: "Weight at ITC Yard (MT)", type: "number", step: "0.001" },
      { key: "weight_loss", label: "Weight Loss (MT)", type: "number", step: "0.001", autoCalc: "weightLoss" },
    ],
  },
  {
    title: "Transport Payment",
    fields: [
      { key: "transport_rate", label: "Rate Fixed For Transportation", type: "number", step: "0.01" },
      { key: "advance_paid", label: "Advance Paid (70%)", type: "number", step: "0.01" },
      { key: "advance_payment_date", label: "Advance Payment Date", type: "date" },
      { key: "advance_paid_to", label: "Advance Paid To", type: "text" },
      { key: "final_payment", label: "Final Payment (30%)", type: "number", step: "0.01" },
      { key: "total_payment_to_transport", label: "Total Payment to Transport", type: "number", step: "0.01" },
    ],
  },
  {
    title: "Material, Invoice & GST",
    fields: [
      { key: "material_cost", label: "Cost of Material", type: "number", step: "0.01" },
      { key: "invoice_value_raised", label: "Invoice Value Raised", type: "number", step: "0.01" },
      { key: "tax_invoice_number", label: "Tax Invoice Number", type: "text" },
      { key: "bill_amount_raised_itc", label: "Bill/Amount Raised at ITC", type: "number", step: "0.01" },
      { key: "bill_amount_raised_date_itc", label: "Bill Raised Date (ITC)", type: "date" },
      { key: "gst_amount", label: "GST Amount", type: "number", step: "0.01" },
    ],
  },
  {
    title: "Settlement",
    fields: [
      { key: "payment_received_date_itc", label: "Payment Received Date (ITC)", type: "date" },
      { key: "total_amount_received_itc", label: "Total Amount Received (ITC)", type: "number", step: "0.01" },
      { key: "margin_pnl", label: "Margin (P&L)", type: "number", step: "0.01", autoCalc: "margin" },
    ],
  },
];

const ASSESSMENT_FIELDS = [
  { key: "sr_no", label: "Sr No.", type: "number" },
  { key: "truck_number", label: "Truck Number", type: "text" },
  { key: "material_loaded", label: "Material Loaded", type: "text" },
  { key: "loading_location", label: "Loading Location", type: "text" },
  { key: "dispatch_date", label: "Date of Dispatch", type: "date" },
  { key: "reached_on", label: "Reached On", type: "date" },
  { key: "weight_pi_yard_mt", label: "Weight at Prakritik Ind. Yard (MT)", type: "number", step: "0.001" },
  { key: "weight_itc_yard", label: "Weight at ITC Yard (MT)", type: "number", step: "0.001" },
  { key: "weight_loss_mt", label: "Weight Loss (MT)", type: "number", step: "0.001" },
  { key: "eway_bill_amt_with_gst", label: "E-Way Bill Amt With GST", type: "number", step: "0.01" },
  { key: "payment_received_itc", label: "Payment Received from ITC", type: "number", step: "0.01" },
  { key: "gst_amount", label: "GST Amount", type: "number", step: "0.01" },
  { key: "total_amount_received", label: "Total Amount Received", type: "number", step: "0.01" },
  { key: "difference_in_credit", label: "Difference in Credit", type: "number", step: "0.01" },
];

function allLogEntryFields() {
  return LOG_ENTRY_SECTIONS.flatMap((s) => s.fields);
}
