import { Box, HStack, Text, Tooltip, VStack } from '@chakra-ui/react';
import React from 'react';

interface Theme {
  bg: string;
  panel: string;
  border: string;
  text: string;
  muted: string;
  inputBg: string;
}

type SolvedEntry = {
  question: {
    difficulty: 'Easy' | 'Medium' | 'Hard';
    questionId: string;
    questionFrontendId?: string;
    title?: string;
  };
  topicTags?: { name: string }[];
  timestamp: number;
};

interface ProfilePageProps {
  theme: Theme;
  colorMode: 'light' | 'dark';
  problemsSolved: Record<string, SolvedEntry>;
}

const brand = { accent: '#c3382d', success: '#2f8f6b', gold: '#d19a37' };

const CELL = 4;
const GAP = 1;
const STEP = CELL + GAP;

function cellColor(count: number, mode: 'light' | 'dark'): string {
  if (count === 0) return mode === 'dark' ? '#21262d' : '#ede5d8';
  if (count === 1) return mode === 'dark' ? '#5a1e1a' : '#f5c4c1';
  if (count === 2) return mode === 'dark' ? '#882820' : '#e07070';
  if (count === 3) return mode === 'dark' ? '#b03228' : '#cc4040';
  return '#c3382d';
}

const DAY_LABELS = ['Su', 'M', 'Tu', 'W', 'Th', 'F', 'Sa'];
const LABEL_ROWS = [1, 3, 5];

const ProfilePage: React.FC<ProfilePageProps> = ({ theme, colorMode, problemsSolved }) => {
  const entries = React.useMemo(() => Object.entries(problemsSolved || {}), [problemsSolved]);

  const easy = entries.filter(([, d]) => d.question.difficulty === 'Easy').length;
  const medium = entries.filter(([, d]) => d.question.difficulty === 'Medium').length;
  const hard = entries.filter(([, d]) => d.question.difficulty === 'Hard').length;
  const total = entries.length;

  const dateMap = React.useMemo(() => {
    const m: Record<string, number> = {};
    entries.forEach(([, d]) => {
      const k = new Date(d.timestamp).toISOString().slice(0, 10);
      m[k] = (m[k] || 0) + 1;
    });
    return m;
  }, [entries]);

  const { grid, months } = React.useMemo(() => {
    const today = new Date();
    const start = new Date(today);
    start.setDate(start.getDate() - 51 * 7);
    start.setDate(start.getDate() - start.getDay());

    const grid: { date: string; count: number; future: boolean }[][] = [];
    const months: { label: string; col: number }[] = [];
    const cur = new Date(start);
    let lastMonth = -1;

    for (let w = 0; w < 52; w++) {
      const week: { date: string; count: number; future: boolean }[] = [];
      for (let d = 0; d < 7; d++) {
        const isFuture = cur > today;
        const dateStr = cur.toISOString().slice(0, 10);
        week.push({ date: dateStr, count: isFuture ? 0 : dateMap[dateStr] || 0, future: isFuture });
        cur.setDate(cur.getDate() + 1);
      }
      grid.push(week);

      const firstDate = new Date(week[0].date);
      const m = firstDate.getMonth();
      if (m !== lastMonth) {
        months.push({
          label: firstDate.toLocaleString('default', { month: 'short' }),
          col: w,
        });
        lastMonth = m;
      }
    }

    return { grid, months };
  }, [dateMap]);

  const visibleMonths = months.filter((_, i, arr) => {
    if (i === 0) return true;
    return arr[i].col - arr[i - 1].col >= 3;
  });

  const topTopics = React.useMemo(() => {
    const m: Record<string, number> = {};
    entries.forEach(([, d]) => {
      (d.topicTags || []).forEach((t) => {
        m[t.name] = (m[t.name] || 0) + 1;
      });
    });
    return Object.entries(m)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);
  }, [entries]);

  const topMax = topTopics[0]?.[1] || 1;
  const barMax = Math.max(easy, medium, hard, 1);

  return (
    <VStack px={4} pt={2} pb={4} spacing={4} align="stretch">
      {/* Activity */}
      <Box>
        <Text color={theme.muted} fontSize="10px" fontWeight="700" textTransform="uppercase" mb={2}>
          Activity
        </Text>
        <HStack align="flex-start" spacing={0}>
          {/* Day labels */}
          <Box mr="3px" pt="14px" flexShrink={0}>
            {Array.from({ length: 7 }).map((_, i) => (
              <Box
                key={i}
                h={`${CELL}px`}
                mb={i < 6 ? `${GAP}px` : '0'}
                display="flex"
                alignItems="center"
              >
                {LABEL_ROWS.includes(i) && (
                  <Text fontSize="6px" color={theme.muted} lineHeight="1" userSelect="none">
                    {DAY_LABELS[i]}
                  </Text>
                )}
              </Box>
            ))}
          </Box>

          {/* Grid + month labels */}
          <Box position="relative" flex="1" overflow="hidden">
            {/* Month labels */}
            <Box h="12px" position="relative" mb="2px">
              {visibleMonths.map(({ label, col }) => (
                <Text
                  key={`${label}-${col}`}
                  position="absolute"
                  left={`${col * STEP}px`}
                  fontSize="7px"
                  color={theme.muted}
                  lineHeight="12px"
                  whiteSpace="nowrap"
                  userSelect="none"
                >
                  {label}
                </Text>
              ))}
            </Box>

            {/* Cells */}
            <Box display="flex" style={{ gap: `${GAP}px` }}>
              {grid.map((week, wi) => (
                <Box key={wi} display="flex" flexDirection="column" style={{ gap: `${GAP}px` }}>
                  {week.map((day, di) =>
                    day.future ? (
                      <Box key={di} w={`${CELL}px`} h={`${CELL}px`} flexShrink={0} />
                    ) : (
                      <Tooltip
                        key={di}
                        label={
                          day.count > 0
                            ? `${day.date}: ${day.count} solved`
                            : day.date
                        }
                        hasArrow
                        placement="top"
                        fontSize="9px"
                        openDelay={200}
                      >
                        <Box
                          w={`${CELL}px`}
                          h={`${CELL}px`}
                          borderRadius="1px"
                          bg={cellColor(day.count, colorMode)}
                          flexShrink={0}
                        />
                      </Tooltip>
                    ),
                  )}
                </Box>
              ))}
            </Box>
          </Box>
        </HStack>
      </Box>

      {/* Difficulty breakdown */}
      <Box>
        <HStack justify="space-between" mb={2}>
          <Text color={theme.muted} fontSize="10px" fontWeight="700" textTransform="uppercase">
            Breakdown
          </Text>
          <Text color={theme.muted} fontSize="10px">
            {total} total
          </Text>
        </HStack>
        <VStack spacing={2} align="stretch">
          {(
            [
              { label: '🟢 Easy', count: easy, color: brand.success },
              { label: '🟡 Medium', count: medium, color: brand.gold },
              { label: '🔴 Hard', count: hard, color: brand.accent },
            ] as { label: string; count: number; color: string }[]
          ).map(({ label, count, color }) => (
            <HStack key={label} spacing={2} align="center">
              <Text fontSize="10px" color={theme.text} flexShrink={0} w="64px">
                {label}
              </Text>
              <Box flex="1" h="5px" bg={theme.panel} borderRadius="full" overflow="hidden">
                <Box
                  h="100%"
                  w={`${(count / barMax) * 100}%`}
                  bg={color}
                  borderRadius="full"
                  transition="width 0.35s ease"
                />
              </Box>
              <Text fontSize="10px" fontWeight="700" color={theme.text} w="18px" textAlign="right" flexShrink={0}>
                {count}
              </Text>
            </HStack>
          ))}
        </VStack>
      </Box>

      {/* Top topics */}
      {topTopics.length > 0 && (
        <Box>
          <Text color={theme.muted} fontSize="10px" fontWeight="700" textTransform="uppercase" mb={2}>
            Top Topics
          </Text>
          <VStack spacing={1.5} align="stretch">
            {topTopics.map(([topic, count]) => (
              <HStack key={topic} spacing={2} align="center">
                <Text
                  fontSize="10px"
                  color={theme.muted}
                  w="80px"
                  flexShrink={0}
                  overflow="hidden"
                  textOverflow="ellipsis"
                  whiteSpace="nowrap"
                >
                  {topic}
                </Text>
                <Box flex="1" h="4px" bg={theme.panel} borderRadius="full" overflow="hidden">
                  <Box
                    h="100%"
                    w={`${(count / topMax) * 100}%`}
                    bg={brand.accent}
                    borderRadius="full"
                    transition="width 0.35s ease"
                  />
                </Box>
                <Text fontSize="10px" color={theme.text} w="16px" textAlign="right" flexShrink={0}>
                  {count}
                </Text>
              </HStack>
            ))}
          </VStack>
        </Box>
      )}

      {total === 0 && (
        <Box py={4} textAlign="center">
          <Text fontSize="12px" color={theme.muted}>
            Solve problems on LeetCode to see your profile!
          </Text>
        </Box>
      )}
    </VStack>
  );
};

export default ProfilePage;
