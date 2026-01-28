
import { runAgent, AgentDeps } from '../lib/agent';

// Mocks
const mockConversations = [
  {
    id: 'conv_mock_1',
    phoneNumberId: 'pn_mock',
    participants: ['+15550199'],
    name: 'Mock User',
    deletedAt: null
  }
];

const mockMessages = [
  {
    id: 'msg_1',
    direction: 'incoming',
    text: 'Hello, I would like to schedule an appointment.',
    createdAt: new Date().toISOString()
  }
];

const mockSummary = {
  dateRange: '2023-01-01 -> 2023-01-02',
  summary: 'User requested an appointment.',
  topics: ['scheduling'],
  explicitName: 'Mock User',
  needsResponse: true,
  draftReply: 'Hi Mock User, what time works best for you?'
};

// Mock Supabase
const mockSupabase = () => {
  return {
    from: (table: string) => {
      let mode = 'query';

      const chain: any = {
        select: (cols?: string) => {
          mode = 'select';
          return chain;
        },
        insert: (data: any) => {
          mode = 'insert';
          console.log(`[MockDB] ${table}.insert:`, JSON.stringify(data, null, 2));
          return chain;
        },
        update: (data: any) => {
          mode = 'update';
          console.log(`[MockDB] ${table}.update:`, JSON.stringify(data, null, 2));
          return chain;
        },
        upsert: (data: any) => {
          console.log(`[MockDB] ${table}.upsert:`, JSON.stringify(data, null, 2));
          return Promise.resolve({ error: null });
        },
        eq: (col: string, val: any) => {
          if (mode === 'update') {
            return Promise.resolve({ error: null });
          }
          return chain;
        },
        in: () => chain,
        or: () => chain,
        limit: () => ({ data: [] }),
        single: async () => {
          if (table === 'runs') {
             return { data: { id: 'mock-run-id', checkpoint: null } };
          }
          return { data: null };
        },
        maybeSingle: async () => ({ data: null })
      };
      return chain;
    }
  };
};

// Dependencies
const deps: AgentDeps = {
  supabaseServer: mockSupabase as any,
  listConversations: async () => ({ data: mockConversations, nextPageToken: null } as any),
  listMessages: async () => ({ data: mockMessages, nextPageToken: null } as any),
  summarizeForCleanup: async () => mockSummary
};

// Run
(async () => {
  console.log('--- Starting Mock Sentinel Run ---');
  try {
    const result = await runAgent({
      startDate: '2023-01-01',
      endDate: '2023-01-02',
      deps
    });
    console.log('--- Run Complete ---');
    console.log('Result:', JSON.stringify(result, null, 2));
  } catch (e: any) {
    console.error('--- Run Failed ---');
    console.error(e);
  }
})();
