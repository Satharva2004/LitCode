import {
  Box,
  Button,
  Container,
  Divider,
  FormControl,
  FormErrorMessage,
  FormHelperText,
  HStack,
  IconButton,
  Input,
  InputGroup,
  Popover,
  PopoverArrow,
  PopoverBody,
  PopoverCloseButton,
  PopoverContent,
  PopoverTrigger,
  Select,
  SimpleGrid,
  Switch,
  Text,
  Tooltip,
  VStack,
} from '@chakra-ui/react';
import React from 'react';
import { BiLink, BiPencil, BiTrendingUp } from 'react-icons/bi';
import { FiBookOpen, FiRefreshCw, FiSettings, FiZap } from 'react-icons/fi';
import Logo from '../components/Logo';
import { GithubHandler, type GithubRepo } from '../handlers';
import { Footer } from './Footer';
import ProfilePage from './ProfilePage';
import { demoSubmissions } from '../utils/demo-submissions';
import { formatProblemsPerDay, getTotalNumberOfStreaks } from '../utils/streak.helper';

interface DashboardProps { }

type ColorMode = 'light' | 'dark';
type ThemeChoice = 'system' | ColorMode;
type LitCodeSyncStatus = {
  state: 'pending' | 'success' | 'failed' | 'skipped';
  message: string;
  slug?: string;
  title?: string;
  path?: string;
  timestamp: number;
};

const brand = {
  accent: '#c3382d',
  accentHover: '#9f2a22',
  gold: '#d19a37',
  success: '#2f8f6b',
  danger: '#b83232',
};

const themes = {
  light: {
    bg: '#fffaf4',
    panel: '#f5eee4',
    border: '#e3d3bd',
    text: '#1f1714',
    muted: '#735f52',
    inputBg: '#fffdf8',
  },
  dark: {
    bg: '#0d1117',
    panel: '#161b22',
    border: '#30363d',
    text: '#c9d1d9',
    muted: '#8b949e',
    inputBg: '#0d1117',
  },
};

const getSystemColorMode = (): ColorMode =>
  window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';

const trimSubdirectory = (text: string) => text.replace(/^\/+|\/+$/g, '');

const Dashboard: React.FC<DashboardProps> = () => {
  const [solvedToday, setSolvedToday] = React.useState(0);
  const [streak, setStreak] = React.useState(0);
  const [totalSolved, setTotalSolved] = React.useState(0);
  const [githubUsername, setGithubUsername] = React.useState('');
  const [repoOwner, setRepoOwner] = React.useState('');
  const [githubRepo, setGithubRepo] = React.useState('');
  const [githubToken, setGithubToken] = React.useState('');
  const [newRepoURL, setNewRepoURL] = React.useState('');
  const [subdirectory, setSubdirectory] = React.useState('');
  const [notificationsEnabled, setNotificationsEnabled] = React.useState(true);
  const [isChangingRepo, setIsChangingRepo] = React.useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = React.useState(false);
  const [isSavingRepo, setIsSavingRepo] = React.useState(false);
  const [isSavingSubdirectory, setIsSavingSubdirectory] = React.useState(false);
  const [repoError, setRepoError] = React.useState('');
  const [subdirectoryError, setSubdirectoryError] = React.useState('');
  const [themeChoice, setThemeChoice] = React.useState<ThemeChoice>('system');
  const [colorMode, setColorMode] = React.useState<ColorMode>(getSystemColorMode);
  const [isPushingDemos, setIsPushingDemos] = React.useState(false);
  const [isRetrying, setIsRetrying] = React.useState(false);
  const [syncStatus, setSyncStatus] = React.useState<LitCodeSyncStatus | null>(null);
  const [view, setView] = React.useState<'home' | 'profile'>('home');
  const [problemsSolved, setProblemsSolved] = React.useState<Record<string, any>>({});

  const [repos, setRepos] = React.useState<GithubRepo[]>([]);
  const [selectedRepo, setSelectedRepo] = React.useState('');
  const [loadingRepos, setLoadingRepos] = React.useState(false);
  const [useManualURL, setUseManualURL] = React.useState(false);
  const reposCached = React.useRef(false);

  React.useEffect(() => {
    chrome.storage.sync.get(
      [
        'problemsSolved',
        'github_username',
        'github_litcode_repo',
        'github_litcode_repo_owner',
        'github_litcode_subdirectory',
        'litcode_color_mode',
        'litcode_notifications_enabled',
        'litcode_last_sync_status',
        'github_litcode_token',
      ],
      (result) => {
        const rawProblems = result.problemsSolved || {};
        const problemSolvedValues = Object.values(rawProblems) as { timestamp: number }[];
        const problemsPerDay = formatProblemsPerDay(problemSolvedValues);
        const today = new Date().toISOString().split('T')[0];
        const savedTheme = result.litcode_color_mode as ThemeChoice | undefined;

        setProblemsSolved(rawProblems);
        setGithubUsername(result.github_username);
        setRepoOwner(result.github_litcode_repo_owner || result.github_username || '');
        setGithubRepo(result.github_litcode_repo);
        setGithubToken(result.github_litcode_token || '');
        setSubdirectory(result.github_litcode_subdirectory || '');
        setSyncStatus(result.litcode_last_sync_status || null);
        setTotalSolved(problemSolvedValues.length);
        setSolvedToday(problemsPerDay?.[today] || 0);
        setStreak(getTotalNumberOfStreaks(problemsPerDay));
        setNotificationsEnabled(result.litcode_notifications_enabled !== false);

        if (savedTheme === 'light' || savedTheme === 'dark') {
          setThemeChoice(savedTheme);
          setColorMode(savedTheme);
        } else {
          setThemeChoice('system');
          setColorMode(getSystemColorMode());
        }
      },
    );

    const listener = (changes: Record<string, chrome.storage.StorageChange>, areaName: string) => {
      if (areaName !== 'sync' || !changes.litcode_last_sync_status) return;
      setSyncStatus(changes.litcode_last_sync_status.newValue || null);
    };

    chrome.storage.onChanged?.addListener(listener);
    return () => chrome.storage.onChanged?.removeListener(listener);
  }, []);

  const theme = themes[colorMode];
  const repoUrl = `https://github.com/${repoOwner || githubUsername}/${githubRepo}`;
  const repoLabel = (repoOwner || githubUsername) && githubRepo ? `${repoOwner || githubUsername}/${githubRepo}` : 'No repo';

  React.useEffect(() => {
    document.body.style.background = theme.bg;
    document.documentElement.style.background = theme.bg;
  }, [theme.bg]);

  const setTheme = (nextTheme: ThemeChoice) => {
    setThemeChoice(nextTheme);
    if (nextTheme === 'system') {
      chrome.storage.sync.remove('litcode_color_mode');
      setColorMode(getSystemColorMode());
      return;
    }

    setColorMode(nextTheme);
    chrome.storage.sync.set({ litcode_color_mode: nextTheme });
  };

  React.useEffect(() => {
    if (!isChangingRepo || !githubToken || reposCached.current) return;
    const fetchRepos = async () => {
      setLoadingRepos(true);
      try {
        const response = await fetch('https://api.github.com/user/repos?per_page=100&sort=updated', {
          headers: {
            Authorization: `token ${githubToken}`,
            Accept: 'application/json',
          },
        });
        if (response.ok) {
          const data = await response.json();
          const repoList: GithubRepo[] = data.map(
            (r: { full_name: string; owner: { login: string }; name: string }) => ({
              fullName: r.full_name,
              owner: r.owner.login,
              name: r.name,
            }),
          );
          setRepos(repoList);
          reposCached.current = true;
          if (repoList.length > 0) {
            setSelectedRepo(repoList[0].fullName);
          } else {
            setUseManualURL(true);
          }
        } else {
          setUseManualURL(true);
        }
      } catch {
        setUseManualURL(true);
      } finally {
        setLoadingRepos(false);
      }
    };
    fetchRepos();
  }, [isChangingRepo, githubToken]);

  const changeRepo = async () => {
    setRepoError('');
    let repoName = '';
    let owner = '';

    if (useManualURL) {
      if (!newRepoURL) {
        setRepoError('Paste a GitHub repo URL.');
        return;
      }
      const sanitizedRepoURL = newRepoURL.replace('.git', '').replace(/\/+$/g, '');
      repoName = sanitizedRepoURL.split('/').pop() || '';
      owner = sanitizedRepoURL.split('/').slice(-2)[0] || '';
    } else {
      if (!selectedRepo) {
        setRepoError('Select a repository.');
        return;
      }
      const found = repos.find((r) => r.fullName === selectedRepo);
      if (!found) {
        setRepoError('Selected repository not found.');
        return;
      }
      repoName = found.name;
      owner = found.owner;
    }

    if (!repoName || !owner) {
      setRepoError('Invalid repository selection.');
      return;
    }

    setIsSavingRepo(true);
    const github = new GithubHandler();
    const isFound = await github.checkIfRepoExists(`${owner}/${repoName}`);
    setIsSavingRepo(false);

    if (!isFound) {
      setRepoError('Repository not found.');
      return;
    }

    chrome.storage.sync.set({ github_litcode_repo: repoName, github_litcode_repo_owner: owner }, () => {
      setRepoOwner(owner);
      setGithubRepo(repoName);
      setNewRepoURL('');
      setIsChangingRepo(false);
    });
  };

  const saveSubdirectory = async () => {
    const trimmed = trimSubdirectory(subdirectory);
    setSubdirectoryError('');

    if (trimmed && !trimmed.match(/^[a-zA-Z0-9-_/]+$/)) {
      setSubdirectoryError('Use letters, numbers, dashes, underscores, and slashes.');
      return;
    }

    setIsSavingSubdirectory(true);
    if (!trimmed) {
      await chrome.storage.sync.remove('github_litcode_subdirectory');
      setSubdirectory('');
    } else {
      await chrome.storage.sync.set({ github_litcode_subdirectory: trimmed });
      setSubdirectory(trimmed);
    }
    setIsSavingSubdirectory(false);
  };

  const toggleNotifications = (enabled: boolean) => {
    setNotificationsEnabled(enabled);
    chrome.storage.sync.set({ litcode_notifications_enabled: enabled });
  };

  const resetAll = () => {
    chrome.storage.sync.clear(() => {
      window.location.reload();
    });
  };

  const pushDemoSubmissions = async () => {
    setIsPushingDemos(true);
    const github = new GithubHandler();

    setTimeout(async () => {
      for (const submission of demoSubmissions) {
        await github.submit(submission);
      }
      setIsPushingDemos(false);
    }, 250);
  };

  const retryCurrentProblem = () => {
    setIsRetrying(true);
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const tab = tabs[0];
      const questionSlug = tab?.url?.match(/leetcode\.com\/problems\/([^/]+)/)?.[1];
      if (!tab?.id || !questionSlug) {
        setIsRetrying(false);
        chrome.storage.sync.set({
          litcode_last_sync_status: {
            state: 'failed',
            message: 'Open a LeetCode problem tab before retrying.',
            timestamp: Date.now(),
          },
        });
        return;
      }

      chrome.tabs.sendMessage(tab.id, { type: 'get-submission', data: { questionSlug, force: true } }, () => {
        setIsRetrying(false);
        if (chrome.runtime.lastError) {
          chrome.storage.sync.set({
            litcode_last_sync_status: {
              state: 'failed',
              message: 'Refresh the LeetCode problem tab, then retry.',
              slug: questionSlug,
              timestamp: Date.now(),
            },
          });
        }
      });
    });
  };

  return (
    <Container
      w="320px"
      minH="300px"
      h="auto"
      p={0}
      bg={theme.bg}
      color={theme.text}
      overflow="hidden"
      display="flex"
      flexDirection="column"
    >
      {/* Always-visible header */}
      <VStack px={4} pt={4} pb={0} spacing={0} align="stretch" flexShrink={0}>
        <HStack justify="space-between" align="center" mb={3}>
          <Logo compact color={theme.text} />
          <Popover isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} placement="bottom-end">
            <PopoverTrigger>
              <IconButton
                aria-label="Open settings"
                icon={<FiSettings />}
                size="xs"
                h="28px"
                minW="28px"
                borderRadius="4px"
                variant="ghost"
                color={theme.text}
                onClick={() => setIsSettingsOpen(true)}
                _hover={{ bg: theme.panel }}
              />
            </PopoverTrigger>
            <PopoverContent
              w="284px"
              maxH="238px"
              borderRadius="6px"
              bg={theme.bg}
              color={theme.text}
              borderColor={theme.border}
              overflow="hidden"
            >
              <PopoverArrow bg={theme.bg} />
              <PopoverCloseButton top="8px" right="8px" color={theme.text} />
              <PopoverBody
                pt={8}
                pb={3}
                pr={3}
                maxH="236px"
                overflowY="auto"
                sx={{
                  scrollbarWidth: 'thin',
                  scrollbarColor: `${theme.border} transparent`,
                  '&::-webkit-scrollbar': {
                    width: '6px',
                  },
                  '&::-webkit-scrollbar-track': {
                    background: 'transparent',
                  },
                  '&::-webkit-scrollbar-thumb': {
                    background: theme.border,
                    borderRadius: '999px',
                  },
                }}
              >
                <VStack align="stretch" spacing={3}>
                  <Box>
                    <Text color={theme.muted} fontSize="10px" fontWeight="700" textTransform="uppercase">
                      Theme
                    </Text>
                    <HStack mt={2} spacing={1}>
                      {(['system', 'light', 'dark'] as ThemeChoice[]).map((choice) => (
                        <Button
                          key={choice}
                          size="xs"
                          h="27px"
                          flex="1"
                          borderRadius="4px"
                          bg={themeChoice === choice ? brand.accent : theme.panel}
                          color={themeChoice === choice ? 'white' : theme.text}
                          onClick={() => setTheme(choice)}
                          _hover={{ bg: themeChoice === choice ? brand.accentHover : theme.inputBg }}
                        >
                          {choice}
                        </Button>
                      ))}
                    </HStack>
                  </Box>

                  <Divider borderColor={theme.border} />

                  <HStack justify="space-between">
                    <Box>
                      <Text fontSize="12px" fontWeight="700">
                        Notifications
                      </Text>
                      <Text color={theme.muted} fontSize="10px">
                        Show upload alerts.
                      </Text>
                    </Box>
                    <Switch
                      size="sm"
                      colorScheme="red"
                      isChecked={notificationsEnabled}
                      onChange={(event) => toggleNotifications(event.target.checked)}
                    />
                  </HStack>

                  <Divider borderColor={theme.border} />

                  <FormControl isInvalid={!!subdirectoryError}>
                    <Text fontSize="12px" fontWeight="700" mb={1}>
                      Subdirectory
                    </Text>
                    <InputGroup size="sm">
                      <Input
                        value={subdirectory}
                        onChange={(event) => setSubdirectory(event.target.value)}
                        placeholder="optional/folder"
                        borderRadius="4px"
                        fontSize="12px"
                        bg={theme.inputBg}
                        color={theme.text}
                        borderColor={theme.border}
                        _placeholder={{ color: theme.muted }}
                      />
                    </InputGroup>
                    <FormErrorMessage fontSize="10px">{subdirectoryError}</FormErrorMessage>
                    <Button
                      mt={2}
                      h="28px"
                      size="xs"
                      borderRadius="4px"
                      bg={theme.panel}
                      color={theme.text}
                      border="1px solid"
                      borderColor={theme.border}
                      isLoading={isSavingSubdirectory}
                      onClick={saveSubdirectory}
                      _hover={{ bg: theme.inputBg }}
                    >
                      Save folder
                    </Button>
                  </FormControl>

                  <Divider borderColor={theme.border} />

                  <Button
                    h="30px"
                    size="xs"
                    borderRadius="4px"
                    color={brand.danger}
                    border="1px solid"
                    borderColor={theme.border}
                    bg={theme.bg}
                    onClick={resetAll}
                    _hover={{ bg: colorMode === 'dark' ? '#2a1412' : '#fff0ed' }}
                  >
                    Reset all LitCode data
                  </Button>
                </VStack>
              </PopoverBody>
            </PopoverContent>
          </Popover>
        </HStack>

        {/* Tab bar */}
        <HStack spacing={0} borderBottom="1px solid" borderColor={theme.border}>
          {(['home', 'profile'] as const).map((v) => (
            <Button
              key={v}
              variant="ghost"
              size="xs"
              h="28px"
              flex="1"
              borderRadius="0"
              fontWeight={view === v ? '700' : '500'}
              fontSize="11px"
              color={view === v ? brand.accent : theme.muted}
              borderBottom={view === v ? `2px solid ${brand.accent}` : '2px solid transparent'}
              onClick={() => setView(v)}
              _hover={{ bg: theme.panel }}
            >
              {v === 'home' ? '⚡ Stats' : '👤 Profile'}
            </Button>
          ))}
        </HStack>
      </VStack>

      {view === 'home' ? (
        <>
          <VStack px={4} pt={3} pb={3} spacing={3} align="stretch" flexShrink={0}>
            <Box>
              <Text color={theme.muted} fontSize="10px" fontWeight="700" textTransform="uppercase">
                Linked repo
              </Text>
              <HStack mt={1} spacing={2} justify="space-between">
                <Button
                  as="a"
                  href={repoUrl}
                  target="_blank"
                  leftIcon={<BiLink />}
                  variant="link"
                  color={theme.text}
                  fontSize="13px"
                  fontWeight="700"
                  minW={0}
                  maxW="232px"
                  justifyContent="flex-start"
                  _hover={{ textDecoration: 'underline' }}
                >
                  <Text isTruncated maxW="200px">
                    {repoLabel}
                  </Text>
                </Button>
                <Popover isOpen={isChangingRepo} onClose={() => setIsChangingRepo(false)} placement="bottom-end">
                  <PopoverTrigger>
                    <IconButton
                      aria-label="Change linked repository"
                      icon={<BiPencil />}
                      borderRadius="4px"
                      size="xs"
                      h="26px"
                      minW="26px"
                      color={theme.text}
                      variant="ghost"
                      onClick={() => setIsChangingRepo(true)}
                      _hover={{ bg: theme.panel }}
                    />
                  </PopoverTrigger>
                  <PopoverContent w="280px" borderRadius="6px" bg={theme.bg} color={theme.text} borderColor={theme.border}>
                    <PopoverArrow bg={theme.bg} />
                    <PopoverCloseButton />
                    <PopoverBody pt={8}>
                      <FormControl isInvalid={!!repoError}>
                        {useManualURL ? (
                          <InputGroup size="sm">
                            <Input
                              value={newRepoURL}
                              onChange={(event) => setNewRepoURL(event.target.value)}
                              placeholder="https://github.com/user/repo"
                              borderRadius="4px"
                              fontSize="12px"
                              bg={theme.inputBg}
                              color={theme.text}
                              borderColor={theme.border}
                              _placeholder={{ color: theme.muted }}
                            />
                          </InputGroup>
                        ) : (
                          <Select
                            size="sm"
                            borderRadius="4px"
                            fontSize="12px"
                            bg={theme.inputBg}
                            color={theme.text}
                            borderColor={theme.border}
                            value={selectedRepo}
                            onChange={(e) => setSelectedRepo(e.target.value)}
                            disabled={loadingRepos}
                            placeholder={loadingRepos ? 'Loading repositories...' : undefined}
                          >
                            {repos.map((r) => (
                              <option key={r.fullName} value={r.fullName} style={{ background: theme.bg, color: theme.text }}>
                                {r.fullName}
                              </option>
                            ))}
                          </Select>
                        )}
                        {!repoError ? (
                          <FormHelperText fontSize="10px" mt={1}>
                            <Text
                              as="span"
                              cursor="pointer"
                              color={brand.accent}
                              textDecoration="underline"
                              onClick={() => setUseManualURL(!useManualURL)}
                            >
                              {useManualURL ? 'Select from list instead' : 'Or paste URL manually'}
                            </Text>
                          </FormHelperText>
                        ) : (
                          <FormErrorMessage fontSize="10px">
                            {repoError}.{' '}
                            <Text
                              as="span"
                              cursor="pointer"
                              color={brand.accent}
                              textDecoration="underline"
                              onClick={() => setUseManualURL(!useManualURL)}
                            >
                              {useManualURL ? 'Select from list instead' : 'Or paste URL manually'}
                            </Text>
                          </FormErrorMessage>
                        )}
                      </FormControl>
                      <Button
                        mt={2}
                        w="100%"
                        h="30px"
                        bg={brand.accent}
                        color="white"
                        borderRadius="4px"
                        size="sm"
                        fontWeight="700"
                        isLoading={isSavingRepo}
                        onClick={changeRepo}
                        _hover={{ bg: brand.accentHover }}
                      >
                        Save repo
                      </Button>
                    </PopoverBody>
                  </PopoverContent>
                </Popover>
              </HStack>
              <Text color={theme.muted} fontSize="11px" mt={1}>
                Free complexity notes and README sync.
              </Text>
            </Box>

            <HStack spacing={2}>
              <Button
                as="a"
                href={repoUrl}
                target="_blank"
                bg={brand.accent}
                color="white"
                borderRadius="4px"
                size="xs"
                h="30px"
                px={3}
                fontWeight="700"
                flex="1"
                _hover={{ bg: brand.accentHover }}
              >
                Open repo
              </Button>
              <Tooltip label="Push sample accepted submissions" hasArrow>
                <Button
                  bg={theme.bg}
                  color={theme.text}
                  border="1px solid"
                  borderColor={theme.border}
                  borderRadius="4px"
                  size="xs"
                  h="30px"
                  px={3}
                  fontWeight="700"
                  isLoading={isPushingDemos}
                  onClick={pushDemoSubmissions}
                  _hover={{ bg: theme.panel }}
                >
                  Demos
                </Button>
              </Tooltip>
              <Tooltip label="Retry current LeetCode problem" hasArrow>
                <IconButton
                  aria-label="Retry current LeetCode problem"
                  icon={<FiRefreshCw />}
                  bg={theme.bg}
                  color={theme.text}
                  border="1px solid"
                  borderColor={theme.border}
                  borderRadius="4px"
                  size="xs"
                  h="30px"
                  minW="30px"
                  isLoading={isRetrying}
                  onClick={retryCurrentProblem}
                  _hover={{ bg: theme.panel }}
                />
              </Tooltip>
            </HStack>
          </VStack>

          {syncStatus && (
            <Box px={4} py={2} borderTop="1px solid" borderColor={theme.border} flexShrink={0}>
              <HStack spacing={1} align="flex-start">
                <Text fontSize="10px" lineHeight="1.4" flexShrink={0}>
                  {syncStatus.state === 'success' ? '✅' : syncStatus.state === 'failed' ? '❌' : syncStatus.state === 'pending' ? '⏳' : '⏭️'}
                </Text>
                <Text
                  fontSize="10px"
                  lineHeight="1.4"
                  color={
                    syncStatus.state === 'failed'
                      ? brand.danger
                      : syncStatus.state === 'success'
                      ? brand.success
                      : theme.muted
                  }
                  noOfLines={2}
                >
                  {syncStatus.message}
                </Text>
              </HStack>
            </Box>
          )}

          <Box px={4} py={2.5} borderTop="1px solid" borderColor={theme.border} flexShrink={0}>
            <SimpleGrid columns={3} spacing={0} w="100%">
              <VStack align="center" justify="center" spacing={1} w="100%" textAlign="center">
                <Box h="14px" display="flex" alignItems="center" justifyContent="center">
                  <FiZap size={13} color={brand.accent} />
                </Box>
                <Text fontWeight="800" fontSize="18px" lineHeight="1">
                  {solvedToday}
                </Text>
                <Text color={theme.muted} fontSize="10px" lineHeight="1">
                  today
                </Text>
              </VStack>
              <VStack align="center" justify="center" spacing={1} w="100%" textAlign="center">
                <Box h="14px" display="flex" alignItems="center" justifyContent="center">
                  <BiTrendingUp size={14} color={brand.accent} />
                </Box>
                <Text fontWeight="800" fontSize="18px" lineHeight="1">
                  {streak}
                </Text>
                <Text color={theme.muted} fontSize="10px" lineHeight="1">
                  streak
                </Text>
              </VStack>
              <VStack align="center" justify="center" spacing={1} w="100%" textAlign="center">
                <Box h="14px" display="flex" alignItems="center" justifyContent="center">
                  <FiBookOpen size={13} color={brand.accent} />
                </Box>
                <Text fontWeight="800" fontSize="18px" lineHeight="1">
                  {totalSolved}
                </Text>
                <Text color={theme.muted} fontSize="10px" lineHeight="1">
                  READMEs
                </Text>
              </VStack>
            </SimpleGrid>
          </Box>
        </>
      ) : (
        <Box overflowY="auto" flex="1">
          <ProfilePage theme={theme} colorMode={colorMode} problemsSolved={problemsSolved} />
        </Box>
      )}

      <Box px={4} py={2} borderTop="1px solid" borderColor={theme.border} mt="auto" flexShrink={0}>
        <Footer muted={theme.muted} text={theme.text} />
      </Box>
    </Container>
  );
};

export default Dashboard;
