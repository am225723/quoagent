
import { runAgent, AgentDeps } from '../lib/agent';

class MockChain {
  constructor(private context: string = '') {}

  select() { return this; }
  insert(data: any) {
    console.log(`[MockSupabase] ${this.context} insert:`, JSON.stringify(data));
    return this;
  }
  update(data: any) {
    console.log(`[MockSupabase] ${this.context} update:`, JSON.stringify(data));
    return this;
  }
  upsert(data: any, opts?: any) {
    console.log(`[MockSupabase] ${this.context} upsert:`, JSON.stringify(data), opts);
    return this;
  }
  eq(col: string, val: any) { return this; }
  in(col: string, vals: any[]) { return this; }
  or(filter: string) { return this; }
  limit(n: number) { return this; }

  single() {
    if (this.context === 'runs') {
        return Promise.resolve({ data: { id: 'mock-run-id', checkpoint: null }, error: null });
    }
    return Promise.resolve({ data: null, error: null });
  }
  maybeSingle() {
     return Promise.resolve({ data: null, error: null });
  }

  then(resolve: (value: any) => void, reject: (reason?: any) => void) {
    resolve({ data: [], error: null });
  }
}

const mockSupabase = {
  from: (table: string) => new MockChain(table)
};

const mockListConversations = async (params: any) => {
  console.log('[MockOpenPhone] listConversations', params);
  return {
    data: [
      {
        id: 'conv_123',
        phoneNumberId: 'pn_123',
        participants: ['+15551234567'],
        name: 'John Doe',
        deletedAt: null
      }
    ],
    nextPageToken: null
  };
};

const mockListMessages = async (params: any) => {
  console.log('[MockOpenPhone] listMessages', params);
  return {
    data: [
      {
        id: 'msg_1',
        direction: 'incoming',
        text: 'Hello, I need an appointment.',
        createdAt: new Date(Date.now() - 3600000).toISOString()
      }
    ],
    nextPageToken: null
  };
};

const mockSummarizeForCleanup = async (transcript: string) => {
  console.log('[MockPerplexity] summarizeForCleanup', transcript);
  return {
    dateRange: 'mock-date-range',
    summary: 'Mock summary of the conversation.',
    topics: ['appointment'],
    explicitName: 'John Doe',
    needsResponse: true,
    draftReply: 'Hi John, when would you like to come in?',
    needsResponseReason: 'Inbound request for appointment'
  };
};

async function main() {
  const deps: AgentDeps = {
    supabase: mockSupabase,
    listConversations: mockListConversations,
    listMessages: mockListMessages,
    summarizeForCleanup: mockSummarizeForCleanup
  };

  console.log('Running sentinel mock...');
  try {
    const result = await runAgent({
      startDate: '2023-01-01',
      endDate: '2023-01-02',
      deps
    });
    console.log('Result:', result);
  } catch (e) {
    console.error('Error running sentinel mock:', e);
    process.exit(1);
  }
}

main();
