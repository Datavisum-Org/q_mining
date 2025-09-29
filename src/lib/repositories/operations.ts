import type { PoolClient } from "pg";

import { runOne, runQuery } from "@/lib/repositories/helpers";
import type {
  OperationInsert,
  OperationRecord,
  OperationRow,
  OperationUpdate,
} from "@/types/database";

const OPERATION_COLUMNS = `
  id,
  name,
  hash_rate,
  power_consumption,
  electricity_rate,
  hardware_cost,
  setup_cost,
  maintenance_cost,
  hardware_type,
  location,
  notes,
  created_at,
  updated_at
`;

function mapRow(row: OperationRow): OperationRecord {
  return {
    id: row.id,
    name: row.name,
    hashRate: Number(row.hash_rate),
    powerConsumption: Number(row.power_consumption),
    electricityRate: Number(row.electricity_rate),
    hardwareCost: Number(row.hardware_cost),
    setupCost: row.setup_cost ? Number(row.setup_cost) : 0,
    maintenanceCost: row.maintenance_cost ? Number(row.maintenance_cost) : 0,
    hardwareType: row.hardware_type,
    location: row.location,
    notes: row.notes,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function toDbColumns(input: OperationInsert | OperationUpdate) {
  return {
    name: input.name,
    hash_rate: input.hashRate,
    power_consumption: input.powerConsumption,
    electricity_rate: input.electricityRate,
    hardware_cost: input.hardwareCost,
    setup_cost: input.setupCost ?? null,
    maintenance_cost: input.maintenanceCost ?? null,
    hardware_type: input.hardwareType ?? null,
    location: input.location ?? null,
    notes: input.notes ?? null,
  };
}

export async function listOperations(limit = 20): Promise<OperationRecord[]> {
  const rows = await runQuery<OperationRow>({
    query: `SELECT ${OPERATION_COLUMNS}
            FROM operations
            ORDER BY created_at DESC
            LIMIT $1`,
    params: [limit],
  });

  return rows.map(mapRow);
}

export async function getOperationById(id: string): Promise<OperationRecord | null> {
  const row = await runOne<OperationRow>({
    query: `SELECT ${OPERATION_COLUMNS} FROM operations WHERE id = $1`,
    params: [id],
  });

  return row ? mapRow(row) : null;
}

export async function createOperation(
  input: OperationInsert,
  client?: PoolClient,
): Promise<OperationRecord> {
  const payload = toDbColumns(input);
  const rows = await runQuery<OperationRow>({
    ...(client ? { client } : {}),
    query: `INSERT INTO operations (
      name,
      hash_rate,
      power_consumption,
      electricity_rate,
      hardware_cost,
      setup_cost,
      maintenance_cost,
      hardware_type,
      location,
      notes
    )
    VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
    RETURNING ${OPERATION_COLUMNS}`,
    params: [
      payload.name,
      payload.hash_rate,
      payload.power_consumption,
      payload.electricity_rate,
      payload.hardware_cost,
      payload.setup_cost,
      payload.maintenance_cost,
      payload.hardware_type,
      payload.location,
      payload.notes,
    ],
  });

  const [row] = rows;
  if (!row) {
    throw new Error("Failed to insert operation record");
  }

  return mapRow(row);
}

export async function updateOperation(
  id: string,
  input: OperationUpdate,
  client?: PoolClient,
): Promise<OperationRecord | null> {
  const columns = toDbColumns(input);
  const entries = Object.entries(columns).filter(([, value]) => value !== undefined);

  if (entries.length === 0) {
    return getOperationById(id);
  }

  const sets = entries.map(([column], index) => `${column} = $${index + 1}`);
  const params = entries.map(([, value]) => value);

  const row = await runOne<OperationRow>({
    ...(client ? { client } : {}),
    query: `UPDATE operations
            SET ${sets.join(", ")}, updated_at = NOW()
            WHERE id = $${entries.length + 1}
            RETURNING ${OPERATION_COLUMNS}`,
    params: [...params, id],
  });

  return row ? mapRow(row) : null;
}

export async function deleteOperation(id: string, client?: PoolClient): Promise<void> {
  await runQuery({
    ...(client ? { client } : {}),
    query: "DELETE FROM operations WHERE id = $1",
    params: [id],
  });
}
