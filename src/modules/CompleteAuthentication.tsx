import {
  Button,
  FormControl,
  FormErrorMessage,
  FormHelperText,
  Heading,
  Input,
  InputGroup,
  Select,
  Text,
  VStack,
} from '@chakra-ui/react';
import { useEffect, useState } from 'react';
import { BsGithub } from 'react-icons/bs';
import { SiLeetcode } from 'react-icons/si';
import { useNavigate } from 'react-router-dom';
import Logo from '../components/Logo';
import { GITHUB_CLIENT_ID, GITHUB_REDIRECT_URI } from '../constants';
import { GithubHandler } from '../handlers';
import { Footer } from './Footer';

export const themes = {
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

const brand = {
  accent: '#c3382d',
  accentHover: '#9f2a22',
};

const AuthorizeWithGithub = ({ nextStep, colorMode = 'light' }: { nextStep: Function; colorMode?: 'light' | 'dark' }) => {
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const theme = themes[colorMode];

  const handleClicked = () => {
    const authUrl = `https://github.com/login/oauth/authorize?client_id=${GITHUB_CLIENT_ID}&redirect_uri=${encodeURIComponent(
      GITHUB_REDIRECT_URI,
    )}&scope=repo`;

    chrome.tabs.create({ url: authUrl, active: true }, function () {
      chrome.tabs.getCurrent(function (tab) {
        if (!tab?.id) return;
        chrome.tabs.remove(tab?.id, function () {});
      });
    });
  };

  useEffect(() => {
    if (accessToken && accessToken.length > 0) {
      nextStep();
    }
  }, [accessToken, nextStep]);

  useEffect(() => {
    chrome.storage.sync.get(['github_litcode_token'], (result) => {
      if (result.github_litcode_token) {
        setAccessToken(result.github_litcode_token);
      }
    });
  }, []);

  return (
    <VStack w="100%" spacing={3}>
      <VStack spacing={1}>
        <Heading size="sm" color={theme.text}>
          Connect GitHub
        </Heading>
        <Text color={theme.muted} fontSize="xs" w="95%" textAlign="center">
          Publish solution files and clean AI notes.
        </Text>
      </VStack>
      <Button
        bg={brand.accent}
        w="95%"
        leftIcon={<BsGithub />}
        color="white"
        borderRadius="4px"
        size="sm"
        h="32px"
        _hover={{ bg: brand.accentHover }}
        onClick={handleClicked}
      >
        Continue with GitHub
      </Button>
      <Text fontSize="10px" color={theme.muted} lineHeight="1">
        You can revoke access at any time.
      </Text>
    </VStack>
  );
};

const AuthorizeWithLeetCode = ({ nextStep, colorMode = 'light' }: { nextStep: Function; colorMode?: 'light' | 'dark' }) => {
  const [leetcodeSession, setLeetcodeSession] = useState<string | null>(null);
  const theme = themes[colorMode];

  const handleClicked = () => {
    const authUrl = `https://leetcode.com/accounts/login/`;
    chrome.storage.sync.set({ pipe_leethub: true }, () => {
      chrome.tabs.create({ url: authUrl, active: true }, function () {
        chrome.tabs.getCurrent(function (tab) {
          if (!tab?.id) return;
          chrome.tabs.remove(tab?.id, function () {});
        });
      });
    });
  };

  useEffect(() => {
    if (leetcodeSession && leetcodeSession.length > 0) {
      nextStep();
    }
  }, [leetcodeSession, nextStep]);

  useEffect(() => {
    chrome.storage.sync.get(['leetcode_session'], (result) => {
      if (result.leetcode_session) {
        setLeetcodeSession(result.leetcode_session);
      }
    });
  }, []);

  return (
    <VStack w="100%" spacing={3}>
      <VStack spacing={1}>
        <Heading size="sm" color={theme.text}>
          Connect LeetCode
        </Heading>
        <Text color={theme.muted} fontSize="xs" w="90%" textAlign="center">
          Read accepted submissions for complexity notes.
        </Text>
      </VStack>

      <Button
        bg={brand.accent}
        color="white"
        borderRadius="4px"
        w="100%"
        size="sm"
        h="32px"
        onClick={handleClicked}
        leftIcon={<SiLeetcode />}
        _hover={{ bg: brand.accentHover }}
      >
        Continue with LeetCode
      </Button>
    </VStack>
  );
};

const SelectRepositoryStep = ({ nextStep, colorMode = 'light' }: { nextStep: Function; colorMode?: 'light' | 'dark' }) => {
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [repositoryURL, setRepositoryURL] = useState<string>('');
  const [selectedRepo, setSelectedRepo] = useState<string>('');
  const [repos, setRepos] = useState<{ fullName: string; owner: string; name: string }[]>([]);
  const [loadingRepos, setLoadingRepos] = useState<boolean>(false);
  const [useManualURL, setUseManualURL] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const theme = themes[colorMode];

  const handleLinkRepo = async () => {
    let repoName = '';
    let owner = '';

    if (useManualURL) {
      if (!repositoryURL) return setError('Repository URL is required');
      const sanitizedRepositoryURL = repositoryURL.replace('.git', '').replace(/\/+$/g, '');
      repoName = sanitizedRepositoryURL.split('/').pop() || '';
      owner = sanitizedRepositoryURL.split('/').slice(-2)[0] || '';
    } else {
      if (!selectedRepo) return setError('Please select a repository');
      const found = repos.find(r => r.fullName === selectedRepo);
      if (!found) return setError('Selected repository not found');
      repoName = found.name;
      owner = found.owner;
    }

    if (!repoName || !owner) {
      return setError('Invalid repository selection');
    }

    setLoading(true);
    const github = new GithubHandler();
    const isFound = await github.checkIfRepoExists(`${owner}/${repoName}`);
    setLoading(false);
    if (!isFound) {
      return setError('Repository not found');
    }
    chrome.storage.sync.set({ github_litcode_repo: repoName, github_litcode_repo_owner: owner }, () => {
      console.log('Repository linked successfully');
      nextStep();
      navigate(0);
    });
  };

  useEffect(() => {
    chrome.storage.sync.get(['github_litcode_token'], (result) => {
      if (!result.github_litcode_token) return;
      setAccessToken(result.github_litcode_token);
    });
  }, []);

  useEffect(() => {
    if (!accessToken) return;
    const fetchRepos = async () => {
      setLoadingRepos(true);
      try {
        const response = await fetch('https://api.github.com/user/repos?per_page=100&sort=updated', {
          headers: {
            Authorization: `token ${accessToken}`,
            Accept: 'application/json',
          },
        });
        if (response.ok) {
          const data = await response.json();
          const repoList = data.map((r: any) => ({
            fullName: r.full_name,
            owner: r.owner.login,
            name: r.name,
          }));
          setRepos(repoList);
          if (repoList.length > 0) {
            setSelectedRepo(repoList[0].fullName);
          } else {
            setUseManualURL(true);
          }
        } else {
          setUseManualURL(true);
        }
      } catch (err) {
        console.error('Failed to fetch repositories:', err);
        setUseManualURL(true);
      } finally {
        setLoadingRepos(false);
      }
    };
    fetchRepos();
  }, [accessToken]);

  return (
    <VStack w="100%" spacing={3}>
      <VStack spacing={1}>
        <Heading size="sm" color={theme.text}>
          Choose Repository
        </Heading>
        <Text color={theme.muted} fontSize="xs" w="90%" textAlign="center">
          Pick where solution folders sync.
        </Text>
      </VStack>

      <FormControl isRequired isInvalid={!!error} w="100%">
        {useManualURL ? (
          <InputGroup size="sm">
            <Input
              placeholder="Repository URL"
              borderRadius="4px"
              fontSize="xs"
              bg={theme.inputBg}
              color={theme.text}
              borderColor={theme.border}
              value={repositoryURL}
              onChange={(e) => {
                setRepositoryURL(e.target.value);
              }}
            />
          </InputGroup>
        ) : (
          <Select
            size="sm"
            borderRadius="4px"
            fontSize="xs"
            bg={theme.inputBg}
            color={theme.text}
            borderColor={theme.border}
            value={selectedRepo}
            onChange={(e) => setSelectedRepo(e.target.value)}
            disabled={loadingRepos}
            placeholder={loadingRepos ? "Loading repositories..." : undefined}
          >
            {repos.map((r) => (
              <option key={r.fullName} value={r.fullName} style={{ background: theme.bg, color: theme.text }}>
                {r.fullName}
              </option>
            ))}
          </Select>
        )}
        {!error ? (
          <FormHelperText fontSize="10px" mt={1}>
            <Text
              as="span"
              cursor="pointer"
              color={brand.accent}
              textDecoration="underline"
              onClick={() => setUseManualURL(!useManualURL)}
            >
              {useManualURL ? "Select from list instead" : "Or paste URL manually"}
            </Text>
          </FormHelperText>
        ) : (
          <FormErrorMessage fontSize="10px">
            {error}.{' '}
            <Text
              as="span"
              cursor="pointer"
              color={brand.accent}
              textDecoration="underline"
              onClick={() => setUseManualURL(!useManualURL)}
            >
              {useManualURL ? "Select from list instead" : "Or paste URL manually"}
            </Text>
          </FormErrorMessage>
        )}
      </FormControl>
      <Button
        bg={brand.accent}
        color="white"
        w="100%"
        borderRadius="4px"
        onClick={handleLinkRepo}
        isLoading={loading}
        isDisabled={loading || (!useManualURL && !selectedRepo) || (useManualURL && !repositoryURL)}
        size="sm"
        h="32px"
        _hover={{ bg: brand.accentHover }}
      >
        Link Repository
      </Button>
      <Text fontSize="10px" color={theme.muted} lineHeight="1">
        You can change this later.
      </Text>
    </VStack>
  );
};

const StartOnboarding = ({ nextStep, colorMode = 'light' }: { nextStep: Function; colorMode?: 'light' | 'dark' }) => {
  const theme = themes[colorMode];
  return (
    <VStack w="100%" h="100%" align="center" justify="center" spacing={3}>
      <Logo compact color={theme.text} />
      <VStack w="100%" spacing={1}>
        <Heading size="md" color={theme.text}>
          Welcome to LitCode
        </Heading>
        <Text color={theme.muted} fontSize="xs" w="90%" textAlign="center">
          Free complexity notes for accepted LeetCode submissions.
        </Text>
      </VStack>

      <VStack w="100%" py={2}>
        <Button
          size="sm"
          bg={brand.accent}
          color="white"
          borderRadius="4px"
          w="95%"
          h="32px"
          _hover={{ bg: brand.accentHover }}
          onClick={() => nextStep()}
        >
          Complete Setup
        </Button>
        <Text fontSize="10px" color={theme.muted}>
          This takes less than 2 minutes.
        </Text>
      </VStack>
      <Footer muted={theme.muted} text={theme.text} />
    </VStack>
  );
};

export { StartOnboarding, AuthorizeWithGithub, AuthorizeWithLeetCode, SelectRepositoryStep };
