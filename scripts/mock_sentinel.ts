import { runAgent } from '../lib/agent';

// Helper to create a chainable mock
const createMockQuery = (table: string) => {
  const query: any = {
    select: (cols: string) => query,
    eq: (col: string, val: any) => query,
    in: (col: string, vals: any[]) => query,
    or: (cond: string) => query,
    limit: async (n: number) => ({ data: [] }),
    single: async () => {
      if (table === 'runs') return { data: { id: 'run_123', checkpoint: null } };
      return { data: null };
    },
    maybeSingle: async () => ({ data: null }),
    insert: (data: any) => {
        console.log(`[MockDB] Insert into ${table}:`, JSON.stringify(data, null, 2));
        // Return an object that has select().single() for the 'runs' creation case
        // or just a promise for others.
        if (table === 'runs') {
             return {
                 select: () => ({
                     single: async () => ({ data: { id: 'run_new_123' } })
                 })
             };
        }
        return { data: null };
    },
    update: (data: any) => {
        console.log(`[MockDB] Update ${table}:`, JSON.stringify(data, null, 2));
        return {
            eq: async (col: string, val: any) => ({ data: null })
        }
    },
    upsert: async (data: any, opts: any) => {
        console.log(`[MockDB] Upsert into ${table}:`, JSON.stringify(data, null, 2));
        return { data: null };
    }
  };

  // Override limit for suppressions check which expects a promise with data
  if (table === 'suppressions') {
       query.limit = async () => ({ data: [] });
  }

  return query;
};

const mockSupabase = () => ({
  from: (table: string) => createMockQuery(table)
} as any);

const mockListConversations = async () => ({
  data: [{
    id: 'conv_mock_1',
    phoneNumberId: 'pn_mock_1',
    participants: ['+12025550100'],
    name: 'Jane Doe',
    deletedAt: null
  }],
  nextPageToken: null
});

const mockListMessages = async () => ({
  data: [
    { id: 'm1', direction: 'incoming', text: 'Hello doctor', createdAt: '2023-01-01T10:00:00Z' },
    { id: 'm2', direction: 'outgoing', text: 'Hi Jane', createdAt: '2023-01-01T10:01:00Z' },
    { id: 'm3', direction: 'incoming', text: 'Can I book for Monday?', createdAt: '2023-01-01T10:05:00Z' }
  ],
  nextPageToken: null
});

const mockSummarize = async () => ({
  dateRange: 'Jan 1',
  summary: 'Jane wants to book an appointment.',
  topics: ['booking'],
  explicitName: 'Jane Doe',
  needsResponse: true,
  draftReply: 'Yes, Monday is open. 10am?'
});

async function run() {
  console.log('--- Starting Mock Sentinel Run ---');
  try {
    const res = await runAgent(
      { startDate: '2023-01-01', endDate: '2023-01-02' },
      {
        supabaseServer: mockSupabase,
        listConversations: mockListConversations as any,
        listMessages: mockListMessages as any,
        summarizeForCleanup: mockSummarize as any
      }
    );
    console.log('--- Run Completed ---');
    console.log(JSON.stringify(res, null, 2));
  } catch (err) {
    console.error('--- Run Failed ---');
    console.error(err);
  }
}

run();
