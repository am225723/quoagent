
import { runAgent } from '../lib/agent';

const MOCK_CONVO_ID = 'C12345';
const MOCK_PHONE = '+15550000000';

const mockConversations = {
  data: [
    {
      id: MOCK_CONVO_ID,
      phoneNumberId: 'PN123',
      participants: [MOCK_PHONE],
      name: 'Unknown Contact',
      deletedAt: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  ],
  nextPageToken: null
};

const mockMessages = {
  data: [
    {
      id: 'M1',
      direction: 'incoming',
      text: 'Hello, this is John Doe. I need an appointment.',
      createdAt: new Date(Date.now() - 100000).toISOString()
    },
    {
      id: 'M2',
      direction: 'outgoing',
      text: 'Hi John, we are busy.',
      createdAt: new Date(Date.now() - 50000).toISOString()
    }
  ],
  nextPageToken: null
};

async function mockListConversations(params: any) {
  console.log('[Mock] listConversations called', params);
  return mockConversations;
}

async function mockListMessages(params: any) {
  console.log('[Mock] listMessages called', params);
  return mockMessages;
}

async function mockSummarizeForCleanup(transcript: string) {
  console.log('[Mock] summarizeForCleanup called. Transcript length:', transcript.length);
  return {
    dateRange: 'Mock Date Range',
    summary: 'Mock summary of the conversation.',
    topics: ['mock topic'],
    explicitName: 'John Doe',
    needsResponse: true,
    draftReply: 'Mock draft reply: Hi John, when are you free?'
  };
}

// Simple mock for Supabase
const createMockSupabase = () => {
  return {
    from: (table: string) => {
      const builder: any = {
        select: (cols: string) => builder,
        eq: (col: string, val: any) => builder,
        in: (col: string, vals: any[]) => builder,
        or: (filter: string) => builder,
        limit: (n: number) => {
             // suppressions return a promise with data
             return Promise.resolve({ data: [] });
        },
        single: async () => {
             if (table === 'runs') return { data: { id: 'mock-run-id', checkpoint: null } };
             return { data: {} };
        },
        maybeSingle: async () => {
             return { data: null }; // Simulate not found for contact_map
        },

        insert: (data: any) => {
             console.log(`[Mock] Insert into ${table}:`, JSON.stringify(data, null, 2));
             // Handle the .select('id').single() chain for runs
             const insertRet: any = Promise.resolve({ error: null });
             insertRet.select = () => ({
                 single: async () => ({ data: { id: 'mock-run-id' } })
             });
             return insertRet;
        },
        update: (data: any) => {
             console.log(`[Mock] Update ${table}:`, JSON.stringify(data, null, 2));
             return {
                 eq: (col: string, val: any) => Promise.resolve({ error: null })
             };
        },
        upsert: (data: any, opts: any) => {
             console.log(`[Mock] Upsert into ${table}:`, JSON.stringify(data, null, 2));
             return Promise.resolve({ error: null });
        }
      };

      return builder;
    }
  } as any;
};

async function main() {
  console.log('Starting Sentinel Mock...');
  try {
    const result = await runAgent({
      startDate: '2023-01-01',
      endDate: '2023-01-02',
      deps: {
        listConversations: mockListConversations,
        listMessages: mockListMessages,
        summarizeForCleanup: mockSummarizeForCleanup,
        supabase: createMockSupabase()
      }
    });
    console.log('Sentinel Mock Completed:', result);
  } catch (e) {
    console.error('Sentinel Mock Failed:', e);
  }
}

main();
