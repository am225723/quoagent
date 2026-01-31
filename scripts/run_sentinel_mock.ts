
import { runAgent, AgentDeps } from '../lib/agent';

// Mock Supabase
const createMockSupabase = () => {
  return {
    from: (table: string) => {
      const builder: any = {
        select: (cols?: string) => builder,
        eq: (col: string, val: any) => builder,
        in: (col: string, vals: any[]) => builder,
        or: (cond: string) => builder,
        limit: (n: number) => builder,
        single: async () => {
          if (table === 'runs') return { data: { id: 'mock-run-id', checkpoint: null } };
          return { data: null, error: null };
        },
        maybeSingle: async () => {
          return { data: null, error: null };
        },
        insert: (row: any) => {
          console.log(`[MockDB] Insert into ${table}:`, JSON.stringify(row, null, 2));
          return builder;
        },
        upsert: (row: any) => {
          console.log(`[MockDB] Upsert into ${table}:`, JSON.stringify(row, null, 2));
          return builder;
        },
        update: (row: any) => {
          console.log(`[MockDB] Update ${table}:`, JSON.stringify(row, null, 2));
          return builder;
        }
      };
      return builder;
    }
  };
};

// Mock OpenPhone
const mockListConversations: any = async (params: any) => {
  console.log('[MockOpenPhone] listConversations called with:', params);
  return {
    data: [
      {
        id: 'C1',
        phoneNumberId: 'PN1',
        participants: ['+15550199'],
        name: 'Mock User',
        deletedAt: null
      }
    ],
    nextPageToken: null
  };
};

const mockListMessages: any = async (params: any) => {
  console.log('[MockOpenPhone] listMessages called with:', params);
  return {
    data: [
      {
        id: 'msg1',
        direction: 'incoming',
        text: 'Hello, I would like to schedule an appointment.',
        createdAt: new Date().toISOString()
      }
    ],
    nextPageToken: null
  };
};

// Mock Perplexity
const mockSummarize: any = async (transcript: string) => {
  console.log('[MockPerplexity] summarizeForCleanup called. Transcript length:', transcript.length);
  return {
    dateRange: 'Mock Date Range',
    summary: 'The user wants to schedule an appointment.',
    topics: ['scheduling'],
    explicitName: null,
    needsResponse: true,
    draftReply: 'Hi! When would you like to come in?'
  };
};

async function main() {
  console.log('Starting Sentinel Mock Run...');

  const deps: AgentDeps = {
    supabase: createMockSupabase(),
    listConversations: mockListConversations,
    listMessages: mockListMessages,
    summarizeForCleanup: mockSummarize
  };

  try {
    const result = await runAgent({
      startDate: '2023-01-01',
      endDate: '2023-01-02',
      deps
    });
    console.log('Sentinel Mock Run Completed Successfully.');
    console.log('Result:', result);
  } catch (e) {
    console.error('Sentinel Mock Run Failed:', e);
    process.exit(1);
  }
}

main();
