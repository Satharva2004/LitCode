import { GITHUB_CLIENT_ID, GITHUB_CLIENT_SECRET, GITHUB_REDIRECT_URI } from '../constants';
import { ReadmeService } from '../services/ReadmeService';
import { RootReadmeService } from '../services/RootReadmeService';
import { QuestionDifficulty } from '../types/Question';
import { Submission } from '../types/Submission';

const languagesToExtensions: Record<string, string> = {
  Python: '.py',
  Python3: '.py',
  'C++': '.cpp',
  C: '.c',
  Java: '.java',
  'C#': '.cs',
  JavaScript: '.js',
  Javascript: '.js',
  Ruby: '.rb',
  Swift: '.swift',
  Go: '.go',
  Kotlin: '.kt',
  Scala: '.scala',
  Rust: '.rs',
  PHP: '.php',
  TypeScript: '.ts',
  MySQL: '.sql',
  'MS SQL Server': '.sql',
  Oracle: '.sql',
  PostgreSQL: '.sql',
  'C++14': '.cpp',
  'C++17': '.cpp',
  'C++11': '.cpp',
  'C++98': '.cpp',
  'C++03': '.cpp',
  'C++20': '.cpp',
  'C++1z': '.cpp',
  'C++1y': '.cpp',
  'C++1x': '.cpp',
  'C++1a': '.cpp',
  CPP: '.cpp',
  Dart: '.dart',
  Elixir: '.ex',
};

const AUTH_STORAGE_KEYS = [
  'github_litcode_token',
  'github_username',
  'github_litcode_repo_owner',
  'github_litcode_repo',
];

interface GithubUser {
  id: number;
  avatar_url?: string | null;
  url: string;
  login: string;
}

type LitCodeSyncStatus = {
  state: 'pending' | 'success' | 'failed' | 'skipped';
  message: string;
  slug?: string;
  title?: string;
  path?: string;
  timestamp: number;
};

type GithubStorage = {
  github_litcode_token?: string;
  github_username?: string;
  github_litcode_repo?: string;
  github_litcode_repo_owner?: string;
  github_litcode_subdirectory?: string;
};

export interface GithubRepo {
  fullName: string;
  owner: string;
  name: string;
}

export default class GithubHandler {
  base_url: string = 'https://api.github.com';
  private client_secret: string | null = GITHUB_CLIENT_SECRET ?? '';
  private client_id: string | null = GITHUB_CLIENT_ID ?? '';
  private redirect_uri: string | null = GITHUB_REDIRECT_URI ?? '';
  private accessToken: string;
  private username: string;
  private repoOwner: string;
  private repo: string;
  private github_litcode_subdirectory: string;
  private storageLoaded: Promise<void>;

  constructor() {
    this.accessToken = '';
    this.username = '';
    this.repoOwner = '';
    this.repo = '';
    this.github_litcode_subdirectory = '';
    this.storageLoaded = this.loadGitHubContext();
  }

  private async getStorage<T extends Record<string, unknown>>(keys: string[]): Promise<T> {
    return new Promise((resolve) => {
      chrome.storage.sync.get(keys, (result) => resolve(result as T));
    });
  }

  private setSyncStatus(status: LitCodeSyncStatus) {
    chrome.storage.sync.set({ litcode_last_sync_status: status });
  }

  private async loadGitHubContext() {
    const result = await this.getStorage<GithubStorage>([
      'github_litcode_token',
      'github_username',
      'github_litcode_repo',
      'github_litcode_repo_owner',
      'github_litcode_subdirectory',
    ]);

    this.accessToken = result.github_litcode_token || '';
    this.username = result.github_username || '';
    this.repoOwner = result.github_litcode_repo_owner || result.github_username || '';
    this.repo = result.github_litcode_repo || '';
    this.github_litcode_subdirectory = result.github_litcode_subdirectory || '';
  }

  private async ensureGitHubContext() {
    await this.storageLoaded;
    if (!this.accessToken || !this.username || !this.repo) {
      await this.loadGitHubContext();
    }
  }

  async loadTokenFromStorage(): Promise<string> {
    return new Promise((resolve) => {
      chrome.storage.sync.get(['github_litcode_token'], (result) => {
        const token = result['github_litcode_token'];
        if (!token) {
          resolve('');
          return;
        }
        resolve(token);
      });
    });
  }

  async authorize(code: string): Promise<string | null> {
    const access_token = await this.fetchAccessToken(code);
    if (!access_token) return null;
    const user = await this.fetchGithubUser(access_token);
    if (!user) return null;
    this.accessToken = access_token;
    this.username = user.login;
    this.repoOwner = user.login;
    return access_token;
  }

  async fetchGithubUser(token: string): Promise<GithubUser | null> {
    const response = await fetch(`${this.base_url}/user`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        Authorization: `token ${token}`,
      },
    }).then((r) => r.json());

    if (!response || response.message === 'Bad credentials') {
      chrome.storage.sync.remove(AUTH_STORAGE_KEYS);
      return null;
    }

    chrome.storage.sync.set({
      github_litcode_token: token,
      github_username: response.login,
      github_litcode_repo_owner: response.login,
    });
    return response;
  }

  async fetchAccessToken(code: string): Promise<string | undefined> {
    const token = await this.loadTokenFromStorage();
    if (token) return token;

    const tokenUrl = 'https://github.com/login/oauth/access_token';
    const body = {
      code,
      client_id: this.client_id,
      redirect_uri: this.redirect_uri,
      client_secret: this.client_secret,
    };
    const response = await fetch(tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify(body),
    }).then((r) => r.json());

    if (!response || response.message === 'Bad credentials') {
      return undefined;
    }

    chrome.storage.sync.set({ github_litcode_token: response.access_token });
    return response.access_token;
  }

  async checkIfRepoExists(repo_name: string): Promise<boolean> {
    const trimmedRepoName = repo_name.replace('.git', '').trim();
    if (!trimmedRepoName) return false;
    const result = await fetch(`${this.base_url}/repos/${trimmedRepoName}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        Authorization: `token ${await this.loadTokenFromStorage()}`,
      },
    })
      .then((x) => x.json())
      .catch(() => null);
    if (!result || result.message === 'Not Found' || result.message === 'Bad credentials') {
      return false;
    }
    return true;
  }

  public getProblemExtension(lang: string) {
    return languagesToExtensions[lang];
  }

  async fileExists(path: string, fileName: string): Promise<string | null> {
    await this.ensureGitHubContext();
    const url = `https://api.github.com/repos/${this.repoOwner}/${this.repo}/contents/${path}/${fileName}`;
    const uploadedFile = await fetch(url, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${this.accessToken}`,
        'Content-Type': 'application/json',
      },
    })
      .then((x) => x.json())
      .catch(() => null);

    if (!uploadedFile || uploadedFile.message === 'Not Found') {
      return null;
    }
    return uploadedFile.sha;
  }

  async upload(path: string, fileName: string, content: string, commitMessage: string) {
    await this.ensureGitHubContext();
    const sha = await this.fileExists(path, fileName);
    const url = `https://api.github.com/repos/${this.repoOwner}/${this.repo}/contents/${path}/${fileName}`;
    const data = {
      message: commitMessage,
      content: btoa(unescape(encodeURIComponent(content))),
      sha,
    };

    const result = await fetch(url, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${this.accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    })
      .then((x) => x.json())
      .catch((err) => {
        throw new Error(`Network error during upload: ${err?.message ?? 'unknown'}`);
      });

    if (!result || result.message) {
      throw new Error(result?.message || 'GitHub upload failed');
    }
  }

  notifySubmissionUploaded(title: string, path: string) {
    if (!chrome.notifications?.create) return;
    chrome.storage.sync.get(['litcode_notifications_enabled'], (result) => {
      if (result.litcode_notifications_enabled === false) return;
      chrome.notifications.create({
        type: 'basic',
        iconUrl: chrome.runtime.getURL('logo-128.png'),
        title: 'LitCode pushed your solution',
        message: `${title} README and code are now in ${this.repoOwner}/${this.repo}/${path}.`,
      });
    });
  }

  getDifficultyColor(difficulty: QuestionDifficulty) {
    switch (difficulty) {
      case 'Easy':
        return 'brightgreen';
      case 'Medium':
        return 'orange';
      case 'Hard':
        return 'red';
    }
  }

  private buildContentsUrl(filePath: string): string {
    return `${this.base_url}/repos/${this.repoOwner}/${this.repo}/contents/${filePath}`;
  }

  private async fileExistsAtPath(filePath: string): Promise<string | null> {
    await this.ensureGitHubContext();
    const result = await fetch(this.buildContentsUrl(filePath), {
      headers: { Authorization: `Bearer ${this.accessToken}`, 'Content-Type': 'application/json' },
    })
      .then((x) => x.json())
      .catch(() => null);
    if (!result || result.message === 'Not Found') return null;
    return result.sha ?? null;
  }

  private async uploadToPath(filePath: string, content: string, commitMessage: string) {
    await this.ensureGitHubContext();
    const sha = await this.fileExistsAtPath(filePath);
    const data: Record<string, unknown> = {
      message: commitMessage,
      content: btoa(unescape(encodeURIComponent(content))),
    };
    if (sha) data.sha = sha;

    const result = await fetch(this.buildContentsUrl(filePath), {
      method: 'PUT',
      headers: { Authorization: `Bearer ${this.accessToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
      .then((x) => x.json())
      .catch((err) => { throw new Error(`Upload error: ${err?.message ?? 'unknown'}`); });

    if (!result || result.message) throw new Error(result?.message || 'GitHub upload failed');
  }

  private async updateRootReadme() {
    try {
      const { problemsSolved } = await chrome.storage.sync.get('problemsSolved');
      if (!problemsSolved || Object.keys(problemsSolved).length === 0) return;

      const rootReadmeService = new RootReadmeService();
      const content = rootReadmeService.generate(problemsSolved);

      const filePath = this.github_litcode_subdirectory
        ? `${this.github_litcode_subdirectory}/README.md`
        : 'README.md';

      await this.uploadToPath(filePath, content, 'LitCode: update solutions index');
    } catch {
      // Root README update is best-effort; don't fail the main sync
    }
  }

  async createReadmeFile(path: string, content: string, message: string) {
    await this.upload(path, 'README.md', content, message);
  }

  async createNotesFile(path: string, notes: string, message: string, questionTitle: string) {
    const mdContent = `<h2>${questionTitle} Notes</h2><hr>${notes}`;
    await this.upload(path, 'Notes.md', mdContent, message);
  }

  async createSolutionFile(
    path: string,
    code: string,
    problemName: string,
    lang: string,
    stats: {
      memory: number;
      memoryDisplay: string;
      memoryPercentile: number;
      runtime: number;
      runtimeDisplay: string;
      runtimePercentile: number;
    },
  ) {
    const msg = `Time: ${stats.runtimeDisplay} (${stats.runtimePercentile.toFixed(2)}%) | Memory: ${
      stats.memoryDisplay
    } (${stats.memoryPercentile.toFixed(2)}%) - LitCode`;
    await this.upload(path, `${problemName}${lang}`, code, msg);
  }

  async submit(submission: Submission): Promise<boolean> {
    await this.ensureGitHubContext();
    const timestamp = Date.now();

    if (!this.accessToken || !this.username || !this.repo) {
      this.setSyncStatus({
        state: 'failed',
        message: 'Missing GitHub credentials. Reconnect GitHub and choose a repo.',
        timestamp,
      });
      return false;
    }

    const {
      code,
      memory,
      memoryDisplay,
      memoryPercentile,
      runtime,
      runtimePercentile,
      runtimeDisplay,
      lang,
      statusCode,
      question,
      notes,
      topicTags,
    } = submission;

    const titleSlug = question.titleSlug;
    const title = question.title;

    this.setSyncStatus({
      state: 'pending',
      message: `Uploading ${title} to GitHub...`,
      slug: titleSlug,
      title,
      timestamp,
    });

    if (statusCode !== 10) {
      this.setSyncStatus({
        state: 'skipped',
        message: `${title} was not accepted, so LitCode skipped it.`,
        slug: titleSlug,
        title,
        timestamp: Date.now(),
      });
      return false;
    }

    let basePath = `${question.questionFrontendId ?? question.questionId ?? 'unknown'}-${question.titleSlug}`;
    if (this.github_litcode_subdirectory) {
      basePath = `${this.github_litcode_subdirectory}/${basePath}`;
    }

    const { content, difficulty, questionId, questionFrontendId } = question;
    const langExtension = this.getProblemExtension(lang.verboseName);

    if (!langExtension) {
      this.setSyncStatus({
        state: 'failed',
        message: `${lang.verboseName} is not supported yet. Open an issue to request it.`,
        slug: titleSlug,
        title,
        timestamp: Date.now(),
      });
      return false;
    }

    try {
      const readmeService = new ReadmeService();
      const readmeContent = await readmeService.generate({
        title,
        slug: titleSlug,
        difficulty,
        problemContent: content,
        code,
        language: lang.verboseName,
        runtimeDisplay,
        memoryDisplay,
        runtimePercentile,
        memoryPercentile,
        questionFrontendId,
        topicTags: topicTags?.map((t) => ({ name: t.name })),
        submittedAt: submission.timestamp,
      });

      await this.createReadmeFile(basePath, readmeContent, `LitCode: add README for ${title}`);

      if (notes && notes.length) {
        await this.createNotesFile(basePath, notes, `LitCode: add notes for ${title}`, title);
      }

      await this.createSolutionFile(basePath, code, question.titleSlug, langExtension, {
        memory,
        memoryDisplay,
        memoryPercentile,
        runtime,
        runtimeDisplay,
        runtimePercentile,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'GitHub upload failed';
      this.setSyncStatus({
        state: 'failed',
        message: `Failed to sync ${title}: ${message}`,
        slug: titleSlug,
        title,
        path: basePath,
        timestamp: Date.now(),
      });
      return false;
    }

    const todayTimestamp = Date.now();
    chrome.storage.sync.set({ lastSolved: { slug: titleSlug, timestamp: todayTimestamp } });

    const { problemsSolved } = (await chrome.storage.sync.get('problemsSolved')) ?? {
      problemsSolved: [],
    };

    chrome.storage.sync.set({
      problemsSolved: {
        ...problemsSolved,
        [titleSlug]: {
          question: { difficulty, questionId, questionFrontendId, title },
          topicTags: topicTags?.map((t) => ({ name: t.name })) ?? [],
          timestamp: todayTimestamp,
        },
      },
    });

    // Fire-and-forget: update root README index after storage is written
    setTimeout(() => this.updateRootReadme(), 500);

    this.notifySubmissionUploaded(title, basePath);
    this.setSyncStatus({
      state: 'success',
      message: `${title} synced to ${this.repoOwner}/${this.repo}.`,
      slug: titleSlug,
      title,
      path: basePath,
      timestamp: Date.now(),
    });
    return true;
  }
}
