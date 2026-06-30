import { CircularProgress, Container, Heading, VStack } from '@chakra-ui/react';
import React, { useEffect, useState } from 'react';
import {
  AuthorizeWithGithub,
  AuthorizeWithLeetCode,
  SelectRepositoryStep,
  StartOnboarding,
  themes,
} from '../modules/CompleteAuthentication';
import Dashboard from '../modules/Dashboard';
import { OnboardingLayout } from '../modules/OnboardingLayout';

type ColorMode = 'light' | 'dark';
type ThemeChoice = 'system' | ColorMode;

const getSystemColorMode = (): ColorMode =>
  window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';

interface PopupProps {}

type UserGlobalData = {
  github_litcode_token: string;
  github_username: string;
  github_litcode_repo: string;
  github_litcode_repo_owner: string;
  leetcode_session: string;
};

const hasCompletedRequirements = (userData: Partial<UserGlobalData>): boolean => {
  return !!(
    userData.github_litcode_token &&
    userData.github_username &&
    userData.github_litcode_repo &&
    userData.leetcode_session
  );
};

const getUserData = async (): Promise<Partial<UserGlobalData>> => {
  const syncData = await chrome.storage.sync.get([
    'github_litcode_token',
    'github_username',
    'github_litcode_repo',
    'github_litcode_repo_owner',
  ]);

  // leetcode_session is stored in local storage by the background script
  const localData = await chrome.storage.local.get(['leetcode_session']);

  return {
    github_litcode_token: syncData.github_litcode_token,
    github_username: syncData.github_username,
    github_litcode_repo: syncData.github_litcode_repo,
    github_litcode_repo_owner: syncData.github_litcode_repo_owner,
    leetcode_session: localData.leetcode_session,
  };
};

const PopupPage: React.FC<PopupProps> = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [isSynced, setIsSynced] = useState(false);
  const [step, setSteps] = useState(1);
  
  const [themeChoice, setThemeChoice] = useState<ThemeChoice>('system');
  const [colorMode, setColorMode] = useState<ColorMode>(getSystemColorMode);

  const nextStep = () => {
    setSteps(Math.min(step + 1, 3));
  };

  const renderStep = () => {
    if (step === 0) {
      return <StartOnboarding nextStep={nextStep} colorMode={colorMode} />;
    }
    if (step === 1) {
      return <AuthorizeWithGithub nextStep={nextStep} colorMode={colorMode} />;
    }
    if (step === 2) {
      return <AuthorizeWithLeetCode nextStep={nextStep} colorMode={colorMode} />;
    }
    if (step === 3) {
      return <SelectRepositoryStep nextStep={nextStep} colorMode={colorMode} />;
    }
  };

  useEffect(() => {
    chrome.storage.sync.get(['litcode_color_mode'], (result) => {
      const savedTheme = result.litcode_color_mode as ThemeChoice | undefined;
      if (savedTheme === 'light' || savedTheme === 'dark') {
        setThemeChoice(savedTheme);
        setColorMode(savedTheme);
      } else {
        setThemeChoice('system');
        setColorMode(getSystemColorMode());
      }
    });
  }, []);

  useEffect(() => {
    if (themeChoice !== 'system') return;
    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const listener = (e: MediaQueryListEvent) => {
      setColorMode(e.matches ? 'dark' : 'light');
    };
    media.addEventListener('change', listener);
    return () => media.removeEventListener('change', listener);
  }, [themeChoice]);

  useEffect(() => {
    setIsLoading(true);

    getUserData().then((result) => {
      if (result && hasCompletedRequirements(result)) {
        setIsSynced(true);
      }
      setIsLoading(false);
    });
  }, [step]);

  useEffect(() => {
    try {
      getUserData().then((result) => {
        setIsLoading(false);
        if (result && hasCompletedRequirements(result)) {
          setIsSynced(true);
        }
        let newStep = 3;
        if (!result.github_litcode_token && !result.github_username) {
          newStep = 0;
        } else if (!result.leetcode_session) {
          newStep = 2;
        }
        setSteps(newStep);
      });
    } catch (err) {
      console.log(err);
      setIsLoading(false);
      setError('An error occurred while trying to fetch your data.');
    }
  }, []);

  useEffect(() => {
    const activeTheme = themes[colorMode];
    document.body.style.background = activeTheme.bg;
    document.documentElement.style.background = activeTheme.bg;
  }, [colorMode]);

  if (isSynced) {
    return <Dashboard />;
  }

  if (error) {
    return <Heading>{error}</Heading>;
  }

  const theme = themes[colorMode];

  return (
    <Container w="320px" minH="300px" h="auto" px={4} py={4} bg={theme.bg} color={theme.text} pos="relative">
      <VStack w="100%" minH="268px" align="center" justify={'center'}>
        {isLoading ? (
          <CircularProgress color="#c3382d" isIndeterminate />
        ) : step === 0 ? (
          renderStep()
        ) : (
          <OnboardingLayout step={step} totalSteps={3} colorMode={colorMode}>
            {renderStep()}
          </OnboardingLayout>
        )}
      </VStack>
    </Container>
  );
};
export default PopupPage;
