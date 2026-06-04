//this script should only run in leetcode/problems/*.com pages  (i.e. the problem page)

import { LeetCodeHandler, GithubHandler } from '../handlers';

const leetcode = new LeetCodeHandler();
const github = new GithubHandler();

const sleep = async (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
const setSyncStatus = (status: {
  state: 'pending' | 'success' | 'failed' | 'skipped';
  message: string;
  slug?: string;
  timestamp: number;
}) => chrome.storage.sync.set({ litcode_last_sync_status: status });

chrome.runtime.onMessage.addListener(async function (request, _s, _sendResponse) {
  if (request && request.type === 'get-submission') {
    const questionSlug = request?.data?.questionSlug;
    const force = !!request?.data?.force;

    if (!questionSlug) return;

    setSyncStatus({
      state: 'pending',
      message: `Checking latest ${questionSlug} submission...`,
      slug: questionSlug,
      timestamp: Date.now(),
    });

    let retries = 0;
    let submission = await leetcode.getSubmission(questionSlug);
    while (!submission && retries < 3) {
      retries++;
      await sleep(retries * 1000);
      submission = await leetcode.getSubmission(questionSlug);
    }
    if (!submission) {
      setSyncStatus({
        state: 'failed',
        message: 'No accepted LeetCode submission was found yet.',
        slug: questionSlug,
        timestamp: Date.now(),
      });
      return;
    }
    //validate submission's timestamp, if its was submitted more than 1 minute ago, then its an old submission and we should ignore it
    const now = new Date();
    const submissionDate = new Date(submission.timestamp * 1000);
    const diff = now.getTime() - submissionDate.getTime();
    const diffInMinutes = Math.floor(diff / 1000 / 60);

    if (!force && diffInMinutes > 1) {
      setSyncStatus({
        state: 'skipped',
        message: 'Latest submission is older, so LitCode skipped the automatic sync.',
        slug: questionSlug,
        timestamp: Date.now(),
      });
      return;
    }

    const isPushed = await github.submit(submission);
    if (isPushed) {
      chrome.runtime.sendMessage({ type: 'set-fire-icon' });
    }
  }
});
