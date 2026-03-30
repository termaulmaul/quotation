import React, { useState, useRef, useCallback } from "react";

// ─── Utility ────────────────────────────────────────────────────────────────
const fmt = (n) =>
  Number(n || 0).toLocaleString("id-ID", { minimumFractionDigits: 0 });

const newRow = (idx) => ({
  id: crypto.randomUUID(),
  no: idx + 1,
  image: null,
  description: "",
  qty: 1,
  unit: "Unit",
  unitPrice: 0,
});

const newSection = (num) => ({
  id: crypto.randomUUID(),
  title: `LANTAI ${num}`,
  rows: [newRow(0)],
});

// ─── Inline Editable Cell ────────────────────────────────────────────────────
function Cell({ value, onChange, align = "left", type = "text", className = "", placeholder = "" }) {
  const [editing, setEditing] = useState(false);
  const inputRef = useRef(null);

  const startEdit = () => {
    setEditing(true);
    setTimeout(() => inputRef.current?.select(), 0);
  };

  const commit = (e) => {
    setEditing(false);
    const raw = e.target.value;
    onChange(type === "number" ? parseFloat(raw) || 0 : raw);
  };

  const displayVal =
    type === "number" && !editing
      ? value === 0
        ? ""
        : fmt(value)
      : value;

  return editing ? (
    <input
      ref={inputRef}
      autoFocus
      type={type === "number" ? "number" : "text"}
      defaultValue={value}
      onBlur={commit}
      onKeyDown={(e) => e.key === "Enter" && commit(e)}
      placeholder={placeholder}
      style={{
        width: "100%",
        border: "none",
        outline: "none",
        background: "#fffef5",
        textAlign: align,
        fontSize: "12px",
        fontFamily: "inherit",
        padding: "2px 4px",
      }}
    />
  ) : (
    <span
      onClick={startEdit}
      style={{
        display: "block",
        textAlign: align,
        cursor: "text",
        minHeight: "16px",
        color: value === 0 || value === "" ? "#bbb" : "inherit",
        fontSize: "12px",
      }}
    >
      {displayVal || placeholder}
    </span>
  );
}

// ─── Image Cell ──────────────────────────────────────────────────────────────
function ImageCell({ value, onChange }) {
  const inputRef = useRef(null);
  const handleFile = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => onChange(ev.target.result);
    reader.readAsDataURL(file);
  };
  return (
    <div
      onClick={() => inputRef.current?.click()}
      style={{
        width: 48,
        height: 48,
        border: "1px dashed #ccc",
        borderRadius: 2,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        cursor: "pointer",
        overflow: "hidden",
        background: "#fafafa",
        margin: "0 auto",
        flexShrink: 0,
      }}
      title="Click to upload image"
    >
      {value ? (
        <img src={value} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
      ) : (
        <span style={{ fontSize: 18, color: "#ccc", lineHeight: 1 }}>+</span>
      )}
      <input ref={inputRef} type="file" accept="image/*" style={{ display: "none" }} onChange={handleFile} />
    </div>
  );
}

// ─── Section Block ───────────────────────────────────────────────────────────
function Section({ section, sectionIdx, totalSections, onChange, onRemove, onMoveUp, onMoveDown, isPrint }) {
  const updateRow = (rowIdx, field, val) => {
    const rows = section.rows.map((r, i) =>
      i === rowIdx ? { ...r, [field]: val } : r
    );
    onChange({ ...section, rows });
  };

  const addRow = () => {
    onChange({ ...section, rows: [...section.rows, newRow(section.rows.length)] });
  };

  const removeRow = (rowIdx) => {
    if (section.rows.length === 1) return;
    onChange({ ...section, rows: section.rows.filter((_, i) => i !== rowIdx) });
  };

  const subtotal = section.rows.reduce((s, r) => s + (r.qty || 0) * (r.unitPrice || 0), 0);

  const COL_WIDTHS = ["32px", "64px", "auto", "52px", "60px", "110px", "110px"];
  if (!isPrint) COL_WIDTHS.push("28px");

  const COL_HEADERS = ["No.", "Image", "Item Description", "Qty", "Unit", "Unit Price (Rp)", "Total (Rp)"];
  if (!isPrint) COL_HEADERS.push("");

  return (
    <div style={{ marginBottom: 28 }}>
      {/* Section title bar */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 0 }}>
        {!isPrint && (
          <div style={{ display: "flex", flexDirection: "column", gap: 1 }}>
            <button
              onClick={onMoveUp}
              disabled={sectionIdx === 0}
              style={arrowBtnStyle}
              title="Move up"
            >▲</button>
            <button
              onClick={onMoveDown}
              disabled={sectionIdx === totalSections - 1}
              style={arrowBtnStyle}
              title="Move down"
            >▼</button>
          </div>
        )}
        <div
          style={{
            flex: 1,
            background: "#2c3e50",
            color: "#fff",
            padding: "5px 10px",
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: "0.08em",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          {isPrint ? (
            <span>{section.title}</span>
          ) : (
            <input
              value={section.title}
              onChange={(e) => onChange({ ...section, title: e.target.value.toUpperCase() })}
              style={{
                background: "transparent",
                border: "none",
                outline: "none",
                color: "#fff",
                fontWeight: 700,
                fontSize: 11,
                letterSpacing: "0.08em",
                fontFamily: "inherit",
                width: 200,
              }}
            />
          )}
          {!isPrint && (
            <button
              onClick={onRemove}
              style={{ background: "none", border: "none", color: "#e74c3c", cursor: "pointer", fontSize: 13, padding: "0 2px" }}
              title="Remove section"
            >✕</button>
          )}
        </div>
      </div>

      {/* Table */}
      <table style={tableStyle}>
        <colgroup>
          {COL_WIDTHS.map((w, i) => <col key={i} style={{ width: w }} />)}
        </colgroup>
        <thead>
          <tr>
            {COL_HEADERS.map((h, i) => (
              <th
                key={i}
                style={{
                  ...thStyle,
                  textAlign: i >= 3 && i <= 6 ? "center" : "left",
                }}
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {section.rows.map((row, ri) => {
            const total = (row.qty || 0) * (row.unitPrice || 0);
            return (
              <tr key={row.id} style={{ background: ri % 2 === 0 ? "#fff" : "#f9f9f9" }}>
                <td style={{ ...tdStyle, textAlign: "center", color: "#888", fontSize: 11 }}>{ri + 1}</td>
                <td style={{ ...tdStyle, padding: "4px 6px" }}>
                  {isPrint ? (
                    row.image ? (
                      <img src={row.image} alt="" style={{ width: 48, height: 48, objectFit: "cover", display: "block", margin: "0 auto" }} />
                    ) : (
                      <div style={{ width: 48, height: 48, border: "1px solid #ddd", margin: "0 auto", background: "#f5f5f5" }} />
                    )
                  ) : (
                    <ImageCell value={row.image} onChange={(v) => updateRow(ri, "image", v)} />
                  )}
                </td>
                <td style={tdStyle}>
                  {isPrint ? (
                    <span style={{ fontSize: 12 }}>{row.description}</span>
                  ) : (
                    <Cell
                      value={row.description}
                      onChange={(v) => updateRow(ri, "description", v)}
                      placeholder="Enter item description…"
                    />
                  )}
                </td>
                <td style={{ ...tdStyle, textAlign: "center" }}>
                  {isPrint ? (
                    <span style={{ fontSize: 12 }}>{row.qty}</span>
                  ) : (
                    <Cell value={row.qty} onChange={(v) => updateRow(ri, "qty", v)} align="center" type="number" placeholder="1" />
                  )}
                </td>
                <td style={{ ...tdStyle, textAlign: "center" }}>
                  {isPrint ? (
                    <span style={{ fontSize: 12 }}>{row.unit}</span>
                  ) : (
                    <Cell value={row.unit} onChange={(v) => updateRow(ri, "unit", v)} align="center" placeholder="Unit" />
                  )}
                </td>
                <td style={{ ...tdStyle, textAlign: "right" }}>
                  {isPrint ? (
                    <span style={{ fontSize: 12 }}>{fmt(row.unitPrice)}</span>
                  ) : (
                    <Cell value={row.unitPrice} onChange={(v) => updateRow(ri, "unitPrice", v)} align="right" type="number" placeholder="0" />
                  )}
                </td>
                <td style={{ ...tdStyle, textAlign: "right", fontWeight: total > 0 ? 500 : 400, color: total > 0 ? "#1a1a1a" : "#ccc" }}>
                  <span style={{ fontSize: 12 }}>{total > 0 ? fmt(total) : "—"}</span>
                </td>
                {!isPrint && (
                  <td style={{ ...tdStyle, textAlign: "center", padding: "0 2px" }}>
                    <button
                      onClick={() => removeRow(ri)}
                      disabled={section.rows.length === 1}
                      style={{
                        background: "none",
                        border: "none",
                        color: section.rows.length === 1 ? "#ddd" : "#e74c3c",
                        cursor: section.rows.length === 1 ? "default" : "pointer",
                        fontSize: 12,
                        padding: 0,
                      }}
                    >✕</button>
                  </td>
                )}
              </tr>
            );
          })}
        </tbody>
        <tfoot>
          <tr>
            <td colSpan={isPrint ? 6 : 7} style={{ ...tdStyle, textAlign: "right", paddingRight: 8, fontWeight: 600, fontSize: 11, color: "#555", letterSpacing: "0.05em", background: "#f4f4f4" }}>
              SUBTOTAL — {section.title}
            </td>
            <td style={{ ...tdStyle, textAlign: "right", fontWeight: 700, fontSize: 12, background: "#f4f4f4", color: "#2c3e50" }}>
              {fmt(subtotal)}
            </td>
            {!isPrint && <td style={{ ...tdStyle, background: "#f4f4f4" }} />}
          </tr>
        </tfoot>
      </table>

      {!isPrint && (
        <button onClick={addRow} style={addRowBtnStyle}>
          + Add Row
        </button>
      )}
    </div>
  );
}

// ─── Main App ────────────────────────────────────────────────────────────────
export default function QuotationBuilder() {
  const [isPrint, setIsPrint] = useState(false);
  const [header, setHeader] = useState({
    companyName: "PT. ANUGERAH MITRAUTAMA SEJAHTERA",
    address: "Jl. Nusantara IX Blok HK No.03 Perum.BDB 2 Sukahati Bogor 16913",
    phone: "Telp : +62 816-717942   Fax : +62 21-87913220",
    email: "info.amsindo@gmail.com ; info@ams-indo.com",
    documentNo: "7-2-AMS-21",
    quotationNo: "SPH-00058/AMS-AE/8-2026 Commax",
    date: "29 Maret 2026",
    yourReferenceNo: "BQ-",
    projectName: "RSUD Kepulauan Seribu",
    pageInfo: "1 dari/from 1 (Termasuk hal ini / Including this page)",
    clientName: "Bp.Aep / +62 821-8960-2774",
    clientAddress: "RSUD Kepulauan Seribu",
    validUntil: "1 minggu setelah tanggal di atas",
  });

  const [sections, setSections] = useState([
    {
      id: crypto.randomUUID(),
      title: "MAIN SERVER",
      rows: [
        { id: crypto.randomUUID(), no: 1, image: null, description: "MP-790S-IWS-B Management Platform 4.0", qty: 1, unit: "Unit", unitPrice: 40866000 },
      ],
    },
    {
      id: crypto.randomUUID(),
      title: "LANTAI 1",
      rows: [
        { id: crypto.randomUUID(), no: 1, image: null, description: "NST-797C-HL3 Nurse Terminal", qty: 1, unit: "Unit", unitPrice: 32694000 },
        { id: crypto.randomUUID(), no: 2, image: null, description: "CLCD-790MD-1 LCD Display Double Side", qty: 1, unit: "Unit", unitPrice: 60789000 },
        { id: crypto.randomUUID(), no: 3, image: null, description: "WDL-774DLC-TU3 Door Light", qty: 2, unit: "Unit", unitPrice: 2141000 },
        { id: crypto.randomUUID(), no: 4, image: null, description: "WBU-774M-HS27 Bed Unit", qty: 5, unit: "Unit", unitPrice: 2453000 },
        { id: crypto.randomUUID(), no: 5, image: null, description: "WCR-CAREU770EB-AL7 Care Unit", qty: 2, unit: "Unit", unitPrice: 1285000 },
        { id: crypto.randomUUID(), no: 6, image: null, description: "WBC-BLUEC770EB-AL7 Blue Code", qty: 2, unit: "Unit", unitPrice: 1285000 },
        { id: crypto.randomUUID(), no: 7, image: null, description: "TPC-CALLU770EB-AL7 Toilet Pullcord Switch", qty: 2, unit: "Unit", unitPrice: 1285000 },
      ],
    },
    {
      id: crypto.randomUUID(),
      title: "LANTAI 2",
      rows: [
        { id: crypto.randomUUID(), no: 1, image: null, description: "NST-797C-HL3 Nurse Terminal", qty: 1, unit: "Unit", unitPrice: 32694000 },
        { id: crypto.randomUUID(), no: 2, image: null, description: "CLCD-790MD-1 LCD Display Double Side", qty: 1, unit: "Unit", unitPrice: 60789000 },
        { id: crypto.randomUUID(), no: 3, image: null, description: "WDL-774DLC-TU3 Door Light", qty: 10, unit: "Unit", unitPrice: 2141000 },
        { id: crypto.randomUUID(), no: 4, image: null, description: "WBU-774M-HS27 Bed Unit", qty: 25, unit: "Unit", unitPrice: 2453000 },
        { id: crypto.randomUUID(), no: 5, image: null, description: "WCR-CAREU770EB-AL7 Care Unit", qty: 10, unit: "Unit", unitPrice: 1285000 },
        { id: crypto.randomUUID(), no: 6, image: null, description: "WBC-BLUEC770EB-AL7 Blue Code", qty: 10, unit: "Unit", unitPrice: 1285000 },
        { id: crypto.randomUUID(), no: 7, image: null, description: "TPC-CALLU770EB-AL7 Toilet Pullcord Switch", qty: 10, unit: "Unit", unitPrice: 1285000 },
      ],
    },
    {
      id: crypto.randomUUID(),
      title: "LANTAI 3",
      rows: [
        { id: crypto.randomUUID(), no: 1, image: null, description: "NST-797C-HL3 Nurse Terminal", qty: 1, unit: "Unit", unitPrice: 32694000 },
        { id: crypto.randomUUID(), no: 2, image: null, description: "CLCD-790MD-1 LCD Display Double Side", qty: 1, unit: "Unit", unitPrice: 60789000 },
        { id: crypto.randomUUID(), no: 3, image: null, description: "WDL-774DLC-TU3 Door Light", qty: 6, unit: "Unit", unitPrice: 2141000 },
        { id: crypto.randomUUID(), no: 4, image: null, description: "WBU-774M-HS27 Bed Unit", qty: 25, unit: "Unit", unitPrice: 2453000 },
        { id: crypto.randomUUID(), no: 5, image: null, description: "WCR-CAREU770EB-AL7 Care Unit", qty: 6, unit: "Unit", unitPrice: 1285000 },
        { id: crypto.randomUUID(), no: 6, image: null, description: "WBC-BLUEC770EB-AL7 Blue Code", qty: 6, unit: "Unit", unitPrice: 1285000 },
        { id: crypto.randomUUID(), no: 7, image: null, description: "TPC-CALLU770EB-AL7 Toilet Pullcord Switch", qty: 6, unit: "Unit", unitPrice: 1285000 },
      ],
    },
  ]);

  const [notes, setNotes] = useState(
    "1 Jadwal Pengiriman / Delivery Schedule : Sesuai kesepakatan setelah PO/SPK ditanda tangani\n2 Termin Pembayaran / Term Of Payment : 40% Setelah PO diterima, 40% Material Onsite, 20% BAST\n3 Alamat Pengiriman / Place Of Delivery : -\n* Harga non PPn\n* Harga Berlaku 1 minggu setelah tanggal diatas\nCATATAN / NOTICE :\nKolom persetujuan pembeli / Buyer, ditanda tangani dan atau distempel lengkap dengan nama dan yang asli atau copy-nya dikembalikan kepada penjual, jika pembeli menyetujui penawaran ini."
  );
  const [prolog, setProlog] = useState(
    "Sesuai dengan kebutuhan yang Bapak/Ibu sampaikan pada kami, berikut kami sampaikan surat penawaran harga dengan syarat dan kondisi sebagai berikut : (Pengiriman barang setelah kami terima Purchase Order dan sesuai dengan termin pembayaran yang ditentukan)."
  );
  const [taxRate] = useState(0);
  const [discountRate] = useState(0.43);

  const grandTotal = sections.reduce(
    (s, sec) => s + sec.rows.reduce((rs, r) => rs + (r.qty || 0) * (r.unitPrice || 0), 0),
    0
  );
  const ppn = Math.round(grandTotal * taxRate);
  const discount = Math.round(grandTotal * discountRate);
  const netTotal = grandTotal - discount;
  const totalWithPpn = netTotal + ppn;

  const updateSection = (idx, sec) => setSections((prev) => prev.map((s, i) => (i === idx ? sec : s)));
  const removeSection = (idx) => setSections((prev) => prev.filter((_, i) => i !== idx));
  const addSection = () =>
    setSections((prev) => [
      ...prev,
      newSection(prev.length + 1),
    ]);
  const moveSection = (idx, dir) => {
    setSections((prev) => {
      const arr = [...prev];
      const target = idx + dir;
      if (target < 0 || target >= arr.length) return arr;
      [arr[idx], arr[target]] = [arr[target], arr[idx]];
      return arr;
    });
  };

  const updateHeader = (field, val) => setHeader((h) => ({ ...h, [field]: val }));

  const handlePrint = () => {
    setIsPrint(true);
    setTimeout(() => {
      window.print();
      setIsPrint(false);
    }, 300);
  };

  return (
    <div style={{ fontFamily: "'Times New Roman', Times, serif", background: isPrint ? "#fff" : "#e8e8e8", minHeight: "100vh" }}>

      {/* Toolbar */}
      {!isPrint && (
        <div style={{
          position: "sticky",
          top: 0,
          zIndex: 100,
          background: "#2c3e50",
          color: "#fff",
          padding: "10px 24px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12,
          boxShadow: "0 2px 8px rgba(0,0,0,0.3)",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: 13, fontWeight: 700, letterSpacing: "0.08em", fontFamily: "sans-serif" }}>
              📄 QUOTATION BUILDER
            </span>
            <span style={{ fontSize: 11, color: "#aaa", fontFamily: "sans-serif" }}>Document Editor</span>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={addSection} style={toolbarBtnStyle("#27ae60")}>+ Add Section</button>
            <button onClick={handlePrint} style={toolbarBtnStyle("#3498db")}>🖨 Print / Preview</button>
          </div>
        </div>
      )}

      {/* Document wrapper */}
      <div style={{
        maxWidth: 900,
        margin: "0 auto",
        padding: isPrint ? 0 : "32px 24px 64px",
      }}>
        <div style={{
          background: "#fff",
          boxShadow: isPrint ? "none" : "0 0 0 1px #ddd, 0 4px 24px rgba(0,0,0,0.10)",
          padding: "40px 48px",
          minHeight: 1000,
        }}>

          {/* ── HEADER ── */}
          <div style={{ borderBottom: "2px solid #2c3e50", paddingBottom: 20, marginBottom: 24, display: "grid", gridTemplateColumns: "1.1fr 1fr", alignItems: "start", gap: 28 }}>
            {/* Left: Company */}
            <div>
              <HeaderField
                value={header.companyName}
                onChange={(v) => updateHeader("companyName", v)}
                style={{ fontSize: 18, fontWeight: 700, color: "#2c3e50", letterSpacing: "0.02em", fontFamily: "'Times New Roman', Times, serif", lineHeight: 1.15, textTransform: "uppercase", maxWidth: 300 }}
                isPrint={isPrint}
              />
              <HeaderField
                value={header.address}
                onChange={(v) => updateHeader("address", v)}
                style={{ fontSize: 11, color: "#555", marginTop: 8, lineHeight: 1.45, maxWidth: 320 }}
                isPrint={isPrint}
              />
              <HeaderField
                value={header.phone}
                onChange={(v) => updateHeader("phone", v)}
                style={{ fontSize: 11, color: "#555", marginTop: 6, lineHeight: 1.45, maxWidth: 320 }}
                isPrint={isPrint}
              />
              <HeaderField
                value={header.email}
                onChange={(v) => updateHeader("email", v)}
                style={{ fontSize: 11, color: "#555", marginTop: 2, lineHeight: 1.45, maxWidth: 320 }}
                isPrint={isPrint}
              />
            </div>

            {/* Right: Meta */}
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 22, fontWeight: 700, color: "#2c3e50", letterSpacing: "0.04em", fontFamily: "'Times New Roman', Times, serif", textAlign: "right" }}>
                PENAWARAN HARGA
              </div>
              <table style={{ borderCollapse: "collapse", width: "100%", fontSize: 11 }}>
                <tbody>
                  {[
                    ["No. Dokumen", header.documentNo, "documentNo"],
                    ["No. Ref. / Reference No", header.quotationNo, "quotationNo"],
                    ["Tanggal / Date", header.date, "date"],
                    ["Your Reference No", header.yourReferenceNo, "yourReferenceNo"],
                    ["Project", header.projectName, "projectName"],
                    ["Hal / Page", header.pageInfo, "pageInfo"],
                  ].map(([label, val, field]) => (
                    <tr key={field}>
                      <td style={{ color: "#666", paddingRight: 10, paddingBottom: 4, whiteSpace: "nowrap", textAlign: "right", verticalAlign: "top", width: "42%" }}>{label}</td>
                      <td style={{ color: "#666", paddingRight: 8, paddingBottom: 4, textAlign: "center", verticalAlign: "top", width: 12 }}>:</td>
                      <td style={{ fontWeight: 600, color: "#333", paddingBottom: 4, textAlign: "right", verticalAlign: "top", lineHeight: 1.35 }}>
                        <HeaderField
                          value={val}
                          onChange={(v) => updateHeader(field, v)}
                          style={{ fontWeight: 600, color: "#333", textAlign: "right" }}
                          isPrint={isPrint}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Client & Project Info */}
          <div style={{ display: "flex", gap: 40, marginBottom: 12, padding: "12px 14px", background: "#f7f8fa", border: "1px solid #e8e8e8" }}>
            <div style={{ minWidth: 260 }}>
              <div style={{ fontSize: 11, color: "#666", letterSpacing: "0.04em", marginBottom: 4, fontFamily: "'Times New Roman', Times, serif", fontWeight: 700 }}>KEPADA / TO :</div>
              <HeaderField
                value={header.clientName}
                onChange={(v) => updateHeader("clientName", v)}
                style={{ fontSize: 13, fontWeight: 700, color: "#2c3e50" }}
                isPrint={isPrint}
              />
            </div>
            <div style={{ borderLeft: "1px solid #ddd", paddingLeft: 40 }}>
              <div style={{ fontSize: 11, color: "#666", letterSpacing: "0.04em", marginBottom: 4, fontFamily: "'Times New Roman', Times, serif", fontWeight: 700 }}>PENGANTAR / PROLOG :</div>
              <HeaderField
                value={prolog}
                onChange={setProlog}
                style={{ fontSize: 11, color: "#555", lineHeight: 1.6 }}
                isPrint={isPrint}
              />
            </div>
          </div>

          <div style={{ marginBottom: 20 }}>
            <HeaderField
              value={header.clientAddress}
              onChange={(v) => updateHeader("clientAddress", v)}
              style={{ fontSize: 11, color: "#666" }}
              isPrint={isPrint}
            />
          </div>

          {/* ── SECTIONS ── */}
          {sections.map((sec, idx) => (
            <Section
              key={sec.id}
              section={sec}
              sectionIdx={idx}
              totalSections={sections.length}
              onChange={(updated) => updateSection(idx, updated)}
              onRemove={() => removeSection(idx)}
              onMoveUp={() => moveSection(idx, -1)}
              onMoveDown={() => moveSection(idx, 1)}
              isPrint={isPrint}
            />
          ))}

          {/* ── TOTALS ── */}
          <div style={{ marginTop: 8, display: "flex", justifyContent: "flex-end" }}>
            <table style={{ borderCollapse: "collapse", minWidth: 320 }}>
              <tbody>
                {sections.map((sec) => {
                  const sub = sec.rows.reduce((s, r) => s + (r.qty || 0) * (r.unitPrice || 0), 0);
                  return (
                    <tr key={sec.id}>
                      <td style={{ fontSize: 11, color: "#666", padding: "3px 12px 3px 0", textAlign: "right" }}>
                        Subtotal {sec.title}
                      </td>
                      <td style={{ fontSize: 11, color: "#333", padding: "3px 0", textAlign: "right", minWidth: 110 }}>
                        Rp {fmt(sub)}
                      </td>
                    </tr>
                  );
                })}
                <tr>
                  <td colSpan={2} style={{ borderTop: "1px solid #ddd", paddingTop: 4 }} />
                </tr>
                <tr>
                  <td style={{ fontSize: 12, color: "#444", padding: "3px 12px 3px 0", textAlign: "right", fontWeight: 600 }}>
                    Sub Total Pricelist
                  </td>
                  <td style={{ fontSize: 12, fontWeight: 700, color: "#2c3e50", textAlign: "right" }}>
                    Rp {fmt(grandTotal)}
                  </td>
                </tr>
                <tr>
                  <td style={{ fontSize: 11, color: "#666", padding: "3px 12px 3px 0", textAlign: "right" }}>
                    Special Discount {Math.round(discountRate * 100)}%
                  </td>
                  <td style={{ fontSize: 11, color: "#555", textAlign: "right" }}>
                    Rp {fmt(discount)}
                  </td>
                </tr>
                <tr>
                  <td style={{ fontSize: 11, color: "#666", padding: "3px 12px 3px 0", textAlign: "right" }}>
                    PPN {Math.round(taxRate * 100)}%
                  </td>
                  <td style={{ fontSize: 11, color: "#555", textAlign: "right" }}>
                    Rp {fmt(ppn)}
                  </td>
                </tr>
                <tr>
                  <td colSpan={2}>
                    <div style={{ background: "#2c3e50", margin: "6px 0 0 0" }}>
                      <table style={{ width: "100%", borderCollapse: "collapse" }}>
                        <tbody>
                          <tr>
                            <td style={{ fontSize: 12, color: "#fff", padding: "8px 12px", textAlign: "right", fontWeight: 700, letterSpacing: "0.04em", fontFamily: "'Times New Roman', Times, serif" }}>
                              SUB NETTO PRICE
                            </td>
                            <td style={{ fontSize: 14, color: "#fff", padding: "8px 12px 8px 0", textAlign: "right", fontWeight: 700, fontFamily: "'Times New Roman', Times, serif" }}>
                              Rp {fmt(totalWithPpn)}
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* ── NOTES ── */}
          <div style={{ marginTop: 36, borderTop: "1px solid #e0e0e0", paddingTop: 20 }}>
            <div style={{ fontSize: 11, color: "#666", letterSpacing: "0.04em", marginBottom: 8, fontFamily: "'Times New Roman', Times, serif", fontWeight: 700 }}>
              SYARAT - SYARAT DAN KONDISI / TERM AND CONDITION
            </div>
            {isPrint ? (
              <div style={{ fontSize: 11, color: "#555", lineHeight: 1.8, whiteSpace: "pre-line" }}>{notes}</div>
            ) : (
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={5}
                style={{
                  width: "100%",
                  fontSize: 11,
                  color: "#555",
                  lineHeight: 1.8,
                  border: "1px solid #e0e0e0",
                  padding: "8px 10px",
                  fontFamily: "inherit",
                  resize: "vertical",
                  outline: "none",
                  background: "#fafafa",
                  boxSizing: "border-box",
                }}
              />
            )}
          </div>

          {/* ── SIGNATURE ── */}
          <div style={{ marginTop: 20, fontSize: 11, color: "#555" }}>
            Seratus dua puluh juta enam ratus lima puluh ribu
          </div>

          <div style={{ marginTop: 40, display: "flex", justifyContent: "space-between" }}>
            {[["PEMBELI / BUYER", "TTD"], ["PEMASOK / VENDOR", "Dani Nurdin / 0816-717942"]].map(([label, name]) => (
              <div key={label} style={{ textAlign: "center", minWidth: 160 }}>
                <div style={{ fontSize: 11, color: "#555", marginBottom: 50 }}>{label}</div>
                <div style={{ borderTop: "1px solid #333", paddingTop: 6 }}>
                  <div style={{ fontSize: 11, fontWeight: 600, color: "#333" }}>{name}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Footer */}
          <div style={{ marginTop: 32, borderTop: "1px solid #e0e0e0", paddingTop: 10, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: 10, color: "#999", fontFamily: "'Times New Roman', Times, serif" }}>{header.quotationNo}</span>
            <span style={{ fontSize: 10, color: "#999", fontFamily: "'Times New Roman', Times, serif" }}>Dokumen ini dibuat secara elektronik • {header.companyName}</span>
          </div>

        </div>
      </div>

      {/* Print styles */}
      <style>{`
        @media print {
          body { margin: 0; background: white; }
          @page { size: A4; margin: 15mm 12mm; }
        }
        * { box-sizing: border-box; }
        input[type=number]::-webkit-inner-spin-button,
        input[type=number]::-webkit-outer-spin-button { opacity: 0.5; }
      `}</style>
    </div>
  );
}

// ─── Header Field ────────────────────────────────────────────────────────────
function HeaderField({ value, onChange, style = {}, isPrint }) {
  const [editing, setEditing] = useState(false);
  const ref = useRef(null);
  if (isPrint) return <span style={{ display: "block", ...style }}>{value}</span>;
  return editing ? (
    <input
      ref={ref}
      autoFocus
      defaultValue={value}
      onBlur={(e) => { setEditing(false); onChange(e.target.value); }}
      onKeyDown={(e) => e.key === "Enter" && ref.current?.blur()}
      style={{
        display: "block",
        border: "none",
        borderBottom: "1px dashed #aaa",
        outline: "none",
        background: "transparent",
        fontFamily: "inherit",
        width: "100%",
        ...style,
      }}
    />
  ) : (
    <span
      onClick={() => setEditing(true)}
      style={{ display: "block", cursor: "text", ...style, borderBottom: "1px dashed transparent" }}
    >
      {value}
    </span>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────
const tableStyle = {
  width: "100%",
  borderCollapse: "collapse",
  border: "1px solid #ccc",
  tableLayout: "fixed",
};

const thStyle = {
  background: "#f0f0f0",
  border: "1px solid #ccc",
  padding: "5px 6px",
  fontSize: 10,
  fontWeight: 700,
  color: "#555",
  letterSpacing: "0.05em",
  fontFamily: "'Times New Roman', Times, serif",
};

const tdStyle = {
  border: "1px solid #ddd",
  padding: "6px 6px",
  verticalAlign: "middle",
  fontSize: 12,
};

const addRowBtnStyle = {
  marginTop: 4,
  padding: "4px 12px",
  fontSize: 11,
  background: "none",
  border: "1px dashed #bbb",
  color: "#888",
  cursor: "pointer",
  fontFamily: "sans-serif",
  letterSpacing: "0.04em",
};

const arrowBtnStyle = {
  width: 18,
  height: 14,
  fontSize: 8,
  background: "#f0f0f0",
  border: "1px solid #ccc",
  cursor: "pointer",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  padding: 0,
  lineHeight: 1,
};

const toolbarBtnStyle = (bg) => ({
  background: bg,
  color: "#fff",
  border: "none",
  padding: "7px 16px",
  fontSize: 12,
  fontFamily: "sans-serif",
  fontWeight: 600,
  cursor: "pointer",
  borderRadius: 3,
  letterSpacing: "0.04em",
});
