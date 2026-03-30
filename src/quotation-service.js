import { getDb } from "./db.js";

function normalizePayload(payload) {
  const header = payload?.header || {};
  const notes = String(payload?.notes || "");
  const sections = Array.isArray(payload?.sections) ? payload.sections : [];
  const taxRate = Number(payload?.taxRate ?? 0.11);

  const normalizedSections = sections.map((section, sectionIndex) => {
    const rows = Array.isArray(section?.rows) ? section.rows : [];
    const normalizedRows = rows.map((row, rowIndex) => {
      const qty = Number(row?.qty || 0);
      const unitPrice = Number(row?.unitPrice || 0);

      return {
        position: rowIndex,
        image: row?.image || null,
        description: String(row?.description || ""),
        qty,
        unit: String(row?.unit || "Unit"),
        unitPrice,
        lineTotal: qty * unitPrice,
      };
    });

    const subtotal = normalizedRows.reduce((sum, row) => sum + row.lineTotal, 0);

    return {
      position: sectionIndex,
      title: String(section?.title || `SECTION ${sectionIndex + 1}`),
      subtotal,
      rows: normalizedRows,
    };
  });

  const grandTotal = normalizedSections.reduce((sum, section) => sum + section.subtotal, 0);
  const taxTotal = Math.round(grandTotal * taxRate);
  const totalWithTax = grandTotal + taxTotal;

  return {
    header: {
      companyName: String(header.companyName || ""),
      address: String(header.address || ""),
      phone: String(header.phone || ""),
      email: String(header.email || ""),
      quotationNo: String(header.quotationNo || ""),
      date: String(header.date || ""),
      projectName: String(header.projectName || ""),
      clientName: String(header.clientName || ""),
      clientAddress: String(header.clientAddress || ""),
      validUntil: String(header.validUntil || ""),
    },
    notes,
    taxRate,
    sections: normalizedSections,
    grandTotal,
    taxTotal,
    totalWithTax,
  };
}

function validatePayload(payload) {
  const requiredHeaderFields = [
    "companyName",
    "address",
    "phone",
    "email",
    "quotationNo",
    "date",
    "projectName",
    "clientName",
    "clientAddress",
    "validUntil",
  ];

  for (const field of requiredHeaderFields) {
    if (!payload.header[field]) {
      throw new Error(`header.${field} is required`);
    }
  }

  if (payload.sections.length === 0) {
    throw new Error("At least one section is required");
  }

  for (const section of payload.sections) {
    if (!section.title) {
      throw new Error("section.title is required");
    }
    if (section.rows.length === 0) {
      throw new Error(`Section "${section.title}" must contain at least one row`);
    }
    for (const row of section.rows) {
      if (!row.description) {
        throw new Error(`A row in section "${section.title}" is missing description`);
      }
    }
  }
}

async function insertSections(connection, quotationId, sections) {
  for (const section of sections) {
    const [sectionResult] = await connection.execute(
      `
        INSERT INTO quotation_sections
          (quotation_id, position, title, subtotal)
        VALUES
          (?, ?, ?, ?)
      `,
      [quotationId, section.position, section.title, section.subtotal]
    );

    for (const row of section.rows) {
      await connection.execute(
        `
          INSERT INTO quotation_rows
            (section_id, position, image, description, qty, unit, unit_price, line_total)
          VALUES
            (?, ?, ?, ?, ?, ?, ?, ?)
        `,
        [
          sectionResult.insertId,
          row.position,
          row.image,
          row.description,
          row.qty,
          row.unit,
          row.unitPrice,
          row.lineTotal,
        ]
      );
    }
  }
}

async function mapQuotation(row) {
  const db = getDb();
  const [sections] = await db.execute(
    `
      SELECT id, position, title, subtotal
      FROM quotation_sections
      WHERE quotation_id = ?
      ORDER BY position ASC, id ASC
    `,
    [row.id]
  );

  const sectionIds = sections.map((section) => section.id);
  const rowsBySectionId = new Map();

  if (sectionIds.length > 0) {
    const [rows] = await db.query(
      `
        SELECT id, section_id, position, image, description, qty, unit, unit_price, line_total
        FROM quotation_rows
        WHERE section_id IN (?)
        ORDER BY position ASC, id ASC
      `,
      [sectionIds]
    );

    for (const item of rows) {
      const bucket = rowsBySectionId.get(item.section_id) || [];
      bucket.push({
        id: item.id,
        image: item.image,
        description: item.description,
        qty: Number(item.qty),
        unit: item.unit,
        unitPrice: Number(item.unit_price),
        total: Number(item.line_total),
      });
      rowsBySectionId.set(item.section_id, bucket);
    }
  }

  return {
    id: row.id,
    header: {
      companyName: row.company_name,
      address: row.address,
      phone: row.phone,
      email: row.email,
      quotationNo: row.quotation_no,
      date: row.quotation_date,
      projectName: row.project_name,
      clientName: row.client_name,
      clientAddress: row.client_address,
      validUntil: row.valid_until,
    },
    notes: row.notes,
    taxRate: Number(row.tax_rate),
    grandTotal: Number(row.grand_total),
    taxTotal: Number(row.tax_total),
    totalWithTax: Number(row.total_with_tax),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    sections: sections.map((section) => ({
      id: section.id,
      title: section.title,
      subtotal: Number(section.subtotal),
      rows: rowsBySectionId.get(section.id) || [],
    })),
  };
}

export async function listQuotations() {
  const db = getDb();
  const [rows] = await db.execute(
    `
      SELECT
        id,
        quotation_no,
        client_name,
        project_name,
        grand_total,
        tax_total,
        total_with_tax,
        created_at,
        updated_at
      FROM quotations
      ORDER BY updated_at DESC, id DESC
    `
  );

  return rows.map((row) => ({
    id: row.id,
    quotationNo: row.quotation_no,
    clientName: row.client_name,
    projectName: row.project_name,
    grandTotal: Number(row.grand_total),
    taxTotal: Number(row.tax_total),
    totalWithTax: Number(row.total_with_tax),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }));
}

export async function getQuotationById(id) {
  const db = getDb();
  const [rows] = await db.execute(
    `
      SELECT *
      FROM quotations
      WHERE id = ?
    `,
    [id]
  );

  if (rows.length === 0) {
    return null;
  }

  return mapQuotation(rows[0]);
}

export async function createQuotation(input) {
  const payload = normalizePayload(input);
  validatePayload(payload);

  const db = getDb();
  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();

    const [result] = await connection.execute(
      `
        INSERT INTO quotations
          (
            company_name,
            address,
            phone,
            email,
            quotation_no,
            quotation_date,
            project_name,
            client_name,
            client_address,
            valid_until,
            notes,
            tax_rate,
            grand_total,
            tax_total,
            total_with_tax
          )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
      [
        payload.header.companyName,
        payload.header.address,
        payload.header.phone,
        payload.header.email,
        payload.header.quotationNo,
        payload.header.date,
        payload.header.projectName,
        payload.header.clientName,
        payload.header.clientAddress,
        payload.header.validUntil,
        payload.notes,
        payload.taxRate,
        payload.grandTotal,
        payload.taxTotal,
        payload.totalWithTax,
      ]
    );

    await insertSections(connection, result.insertId, payload.sections);
    await connection.commit();

    return getQuotationById(result.insertId);
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

export async function updateQuotation(id, input) {
  const payload = normalizePayload(input);
  validatePayload(payload);

  const db = getDb();
  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();

    const [existing] = await connection.execute(
      "SELECT id FROM quotations WHERE id = ?",
      [id]
    );

    if (existing.length === 0) {
      await connection.rollback();
      return null;
    }

    await connection.execute(
      `
        UPDATE quotations
        SET
          company_name = ?,
          address = ?,
          phone = ?,
          email = ?,
          quotation_no = ?,
          quotation_date = ?,
          project_name = ?,
          client_name = ?,
          client_address = ?,
          valid_until = ?,
          notes = ?,
          tax_rate = ?,
          grand_total = ?,
          tax_total = ?,
          total_with_tax = ?
        WHERE id = ?
      `,
      [
        payload.header.companyName,
        payload.header.address,
        payload.header.phone,
        payload.header.email,
        payload.header.quotationNo,
        payload.header.date,
        payload.header.projectName,
        payload.header.clientName,
        payload.header.clientAddress,
        payload.header.validUntil,
        payload.notes,
        payload.taxRate,
        payload.grandTotal,
        payload.taxTotal,
        payload.totalWithTax,
        id,
      ]
    );

    await connection.execute(
      `
        DELETE qr
        FROM quotation_rows AS qr
        INNER JOIN quotation_sections AS qs ON qs.id = qr.section_id
        WHERE qs.quotation_id = ?
      `,
      [id]
    );
    await connection.execute("DELETE FROM quotation_sections WHERE quotation_id = ?", [id]);

    await insertSections(connection, id, payload.sections);
    await connection.commit();

    return getQuotationById(id);
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

export async function deleteQuotation(id) {
  const db = getDb();
  const [result] = await db.execute("DELETE FROM quotations WHERE id = ?", [id]);
  return result.affectedRows > 0;
}
