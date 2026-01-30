
import { runAgent, AgentDeps } from '../lib/agent';

// Mock Supabase Chain
const createChain = (table: string) => {
  const chain: any = {
    select: (cols: string) => {
      console.log(`[Supabase] ${table}.select(${cols})`);
      return chain;
    },
    insert: (data: any) => {
      console.log(`[Supabase] ${table}.insert`, data);
      return chain;
    },
    update: (data: any) => {
      console.log(`[Supabase] ${table}.update`, data);
      return chain;
    },
    upsert: (data: any, opts: any) => {
      console.log(`[Supabase] ${table}.upsert`, data, opts);
      return chain;
    },
    eq: (col: string, val: any) => {
      // console.log(`[Supabase] ${table}.eq(${col}, ${val})`);
      return chain;
    },
    in: (col: string, vals: any[]) => {
      // console.log(`[Supabase] ${table}.in(${col}, [${vals}])`);
      return chain;
    },
    or: (filter: string) => {
      // console.log(`[Supabase] ${table}.or(${filter})`);
      return chain;
    },
    limit: (n: number) => {
      return chain;
    },
    single: async () => {
      if (table === 'runs') {
        // Return a dummy run ID
        return { data: { id: 'mock-run-id', checkpoint: null }, error: null };
      }
      return { data: {}, error: null };
    },
    maybeSingle: async () => {
      return { data: null, error: null };
    },
    then: (resolve: any) => {
      // Default resolution for operations that are awaited directly (like list, insert without select)
      resolve({ data: [], error: null });
    }
  };
  return chain;
};

const mockSupabase = {
  from: (table: string) => createChain(table)
};

// Mock functions
const mockListConversations = async (params: any) => {
  console.log('[OpenPhone] listConversations', params);
  return {
    data: [
      {
        id: 'conv_mock_1',
        phoneNumberId: 'pn_mock',
        participants: ['+15551234567'],
        name: 'Unknown', // To trigger inference logic
        deletedAt: null
      }
    ],
    nextPageToken: null
  };
};

const mockListMessages = async (params: any) => {
  console.log('[OpenPhone] listMessages', params);
  return {
    data: [
      {
        id: 'msg_1',
        direction: 'incoming',
        text: 'Hi, this is John Doe. I would like to schedule a visit.',
        createdAt: new Date().toISOString()
      }
    ],
    nextPageToken: null
  };
};

const mockSummarize = async (transcript: string) => {
  console.log('[Perplexity] summarizeForCleanup');
  // console.log('Transcript:', transcript);
  return {
    dateRange: 'today',
    summary: 'John Doe wants to schedule a visit.',
    topics: ['scheduling', 'visit'],
    explicitName: 'John Doe',
    needsResponse: true,
    draftReply: 'Hi John, thanks for reaching out. When are you available?',
  };
};

async function main() {
  console.log('--- STARTING SENTINEL MOCK ---');
  try {
    const result = await runAgent({
      startDate: '2023-01-01',
      endDate: '2023-01-02'
    }, {
      supabase: mockSupabase,
      listConversations: mockListConversations,
      listMessages: mockListMessages,
      summarizeForCleanup: mockSummarize
    });
    console.log('--- FINISHED SENTINEL MOCK ---');
    console.log('Result:', result);
  } catch (e) {
    console.error('--- ERROR ---', e);
  }
}

main();
