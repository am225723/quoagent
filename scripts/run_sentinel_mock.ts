import { runAgent } from '../lib/agent';

// Mock Dependencies
const mockListConversations = async (params: any) => {
  console.log('Mock listConversations called with:', params);
  return {
    data: [
      {
        id: 'conv_123',
        phoneNumberId: 'pn_123',
        participants: ['+15550001111'],
        name: 'Jane Doe',
        deletedAt: null
      }
    ],
    nextPageToken: null
  };
};

const mockListMessages = async (params: any) => {
  console.log('Mock listMessages called with:', params);
  return {
    data: [
      {
        id: 'msg_1',
        text: 'Hello, I would like to schedule an appointment.',
        createdAt: new Date(Date.now() - 1000 * 60 * 60).toISOString(), // 1 hour ago
        direction: 'incoming'
      }
    ],
    nextPageToken: null
  };
};

const mockSummarizeForCleanup = async (transcript: string) => {
  console.log('Mock summarizeForCleanup called for transcript length:', transcript.length);
  return {
    dateRange: 'Today',
    summary: 'Patient requesting appointment.',
    topics: ['Appointment'],
    explicitName: 'Jane Doe',
    needsResponse: true,
    draftReply: 'Hi Jane, sure! When are you available?'
  };
};

const mockSupabase = {
  from: (table: string) => {
    const createChain = () => {
      const chain: any = {
        select: () => chain,
        eq: () => chain,
        in: () => chain,
        or: () => chain,
        insert: () => chain,
        upsert: () => chain,
        update: () => chain,

        // Terminal methods returning Promise
        single: async () => {
          if (table === 'runs') return { data: { id: 'mock-run-id', checkpoint: null } };
          return { data: null };
        },
        maybeSingle: async () => ({ data: null }),
        limit: async () => ({ data: [] }),

        // Make the chain itself awaitable
        then: (resolve: any) => {
           // For simple inserts/updates without select/single
           return Promise.resolve({ data: {}, error: null }).then(resolve);
        }
      };
      return chain;
    };
    return createChain();
  }
};

async function main() {
  console.log('Starting Sentinel Run with Mocks...');

  try {
    const today = new Date().toISOString().split('T')[0];
    const result = await runAgent({
      startDate: today,
      endDate: today,
      deps: {
        supabase: mockSupabase,
        listConversations: mockListConversations,
        listMessages: mockListMessages,
        summarizeForCleanup: mockSummarizeForCleanup
      }
    });

    console.log('Sentinel Run Completed Successfully!');
    console.log('Result:', JSON.stringify(result, null, 2));
  } catch (error) {
    console.error('Sentinel Run Failed:', error);
    process.exit(1);
  }
}

main();
