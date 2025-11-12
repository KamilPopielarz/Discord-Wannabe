/* Minimal mock for Supabase client used in endpoint tests.
   Tests can expand returned behaviour per test case (set data/error). */
export function createMockSupabase(overrides?: Partial<Record<string, any>>) {
  const state = {
    // customize per-test
    tables: {},
    ...overrides,
  };

  function from(tableName: string) {
    return {
      select: () =>
        Promise.resolve({ data: state.tables[tableName] ?? [], error: null }),
      insert: (payload: any) =>
        Promise.resolve({ data: payload, error: null }),
      update: (payload: any) =>
        Promise.resolve({ data: payload, error: null }),
      delete: () => Promise.resolve({ data: null, error: null }),
      single: () => Promise.resolve({ data: state.tables[tableName]?.[0] ?? null, error: null }),
      eq: () => ({ select: () => Promise.resolve({ data: state.tables[tableName] ?? [], error: null }) }),
    };
  }

  return {
    from,
    // allow tests to set a table's rows quickly
    __setTable(tableName: string, rows: any[]) {
      state.tables[tableName] = rows;
    },
  };
}






