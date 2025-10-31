// tests/adGroupCacheService.test.js

const adGroupCacheService = require('../backend/services/adGroupCacheService');
const adService = require('../backend/services/adService');

// Mock the adService
jest.mock('../backend/services/adService', () => ({
  getAdGroupMembers: jest.fn(),
  searchAdGroups: jest.fn(),
}));

describe('adGroupCacheService', () => {
  beforeEach(() => {
    // Clear mocks before each test
    adService.getAdGroupMembers.mockClear();
    adService.searchAdGroups.mockClear();
  });

  test('getGroup should call adService when cache is empty', async () => {
    const groupName = 'test-group';
    adService.getAdGroupMembers.mockResolvedValueOnce([{ sam: 'user1' }]);

    const result = await adGroupCacheService.getGroup(groupName);

    expect(adService.getAdGroupMembers).toHaveBeenCalledWith(groupName);
    expect(result).toEqual([{ sam: 'user1' }]);
  });

  test('searchGroups should call adService when cache is empty', async () => {
    const query = 'test-query';
    adService.searchAdGroups.mockResolvedValueOnce(['group1', 'group2']);

    const result = await adGroupCacheService.searchGroups(query);

    expect(adService.searchAdGroups).toHaveBeenCalledWith(query);
    expect(result).toEqual(['group1', 'group2']);
  });

  test('invalidateGroup should exist', () => {
    expect(adGroupCacheService.invalidateGroup).toBeDefined();
  });
});
