import type { QuestionDifficulty } from '../types/Question';
import type { Submission } from '../types/Submission';

const easy = 'Easy' as QuestionDifficulty;

const problemContent = {
  twoSum:
    '<p>Given an array of integers <code>nums</code> and an integer <code>target</code>, return indices of the two numbers such that they add up to target.</p><p>You may assume that each input has exactly one solution, and you may not use the same element twice.</p>',
  plusOne:
    '<p>You are given a large integer represented as an integer array <code>digits</code>. Increment the large integer by one and return the resulting array of digits.</p>',
  validParentheses:
    '<p>Given a string <code>s</code> containing just parentheses characters, determine if the input string is valid. Open brackets must be closed by the same type and in the correct order.</p>',
};

export const demoSubmissions: Submission[] = [
  {
    runtime: 2,
    runtimeDisplay: '2 ms',
    runtimePercentile: 98.42,
    runtimeDistribution: { lang: 'JavaScript', distribution: ['2 ms', 98.42] },
    memory: 43.1,
    memoryDisplay: '43.1 MB',
    memoryPercentile: 91.2,
    memoryDistribution: { lang: 'JavaScript', distribution: ['43.1 MB', 91.2] },
    code: `function twoSum(nums, target) {
  const seen = new Map();

  for (let i = 0; i < nums.length; i++) {
    const needed = target - nums[i];
    if (seen.has(needed)) return [seen.get(needed), i];
    seen.set(nums[i], i);
  }

  return [];
}`,
    timestamp: Date.now(),
    statusCode: 10,
    lang: { name: 'javascript', verboseName: 'JavaScript' },
    question: {
      questionId: '1',
      questionFrontendId: '1',
      title: 'Two Sum',
      titleSlug: 'two-sum-litcode-demo',
      difficulty: easy,
      content: problemContent.twoSum,
      likes: 0,
      dislikes: 0,
    },
    user: { username: 'litcode-demo', profile: { realName: 'LitCode Demo', userAvatar: '' } },
  },
  {
    runtime: 0,
    runtimeDisplay: '0 ms',
    runtimePercentile: 100,
    runtimeDistribution: { lang: 'Java', distribution: ['0 ms', 100] },
    memory: 41.9,
    memoryDisplay: '41.9 MB',
    memoryPercentile: 88.55,
    memoryDistribution: { lang: 'Java', distribution: ['41.9 MB', 88.55] },
    code: `class Solution {
    public int[] plusOne(int[] digits) {
        for (int i = digits.length - 1; i >= 0; i--) {
            if (digits[i] < 9) {
                digits[i]++;
                return digits;
            }
            digits[i] = 0;
        }

        int[] result = new int[digits.length + 1];
        result[0] = 1;
        return result;
    }
}`,
    timestamp: Date.now(),
    statusCode: 10,
    lang: { name: 'java', verboseName: 'Java' },
    question: {
      questionId: '66',
      questionFrontendId: '66',
      title: 'Plus One',
      titleSlug: 'plus-one-litcode-demo',
      difficulty: easy,
      content: problemContent.plusOne,
      likes: 0,
      dislikes: 0,
    },
    user: { username: 'litcode-demo', profile: { realName: 'LitCode Demo', userAvatar: '' } },
  },
  {
    runtime: 1,
    runtimeDisplay: '1 ms',
    runtimePercentile: 96.01,
    runtimeDistribution: { lang: 'Python3', distribution: ['1 ms', 96.01] },
    memory: 16.4,
    memoryDisplay: '16.4 MB',
    memoryPercentile: 84.33,
    memoryDistribution: { lang: 'Python3', distribution: ['16.4 MB', 84.33] },
    code: `class Solution:
    def isValid(self, s: str) -> bool:
        stack = []
        pairs = {")": "(", "]": "[", "}": "{"}

        for char in s:
            if char in pairs.values():
                stack.append(char)
            elif not stack or stack.pop() != pairs[char]:
                return False

        return not stack`,
    timestamp: Date.now(),
    statusCode: 10,
    lang: { name: 'python3', verboseName: 'Python3' },
    question: {
      questionId: '20',
      questionFrontendId: '20',
      title: 'Valid Parentheses',
      titleSlug: 'valid-parentheses-litcode-demo',
      difficulty: easy,
      content: problemContent.validParentheses,
      likes: 0,
      dislikes: 0,
    },
    user: { username: 'litcode-demo', profile: { realName: 'LitCode Demo', userAvatar: '' } },
  },
];
