// backend/services/adGroupCacheService.js

const { LRUCache } = require('lru-cache');
const adService = require('./adService');

const options = {
  max: 200,
  ttl: 1000 * 60 * 5, // 5 minutes
};

const cache = new LRUCache(options);

async function getGroup(groupName) {
  const key = `group_${groupName}`;
  if (cache.has(key)) {
    console.log(`[Cache HIT] Group: ${groupName}`);
    return cache.get(key);
  }

  console.log(`[Cache MISS] Group: ${groupName}`);
  const group = await adService.getAdGroupMembers(groupName);
  if (group) {
    cache.set(key, group);
  }
  return group;
}

async function searchGroups(query) {
  const key = `search_${query}`;
  if (cache.has(key)) {
    console.log(`[Cache HIT] Search: ${query}`);
    return cache.get(key);
  }

  console.log(`[Cache MISS] Search: ${query}`);
  const results = await adService.searchAdGroups(query);
  if (results) {
    cache.set(key, results);
  }
  return results;
}

function invalidateGroup(groupName) {
  const key = `group_${groupName}`;
  console.log(`[Cache INVALIDATE] Group: ${groupName}`);
  cache.delete(key);
}

module.exports = {
  getGroup,
  searchGroups,
  invalidateGroup,
};
