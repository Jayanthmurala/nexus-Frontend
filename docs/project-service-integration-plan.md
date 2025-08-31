# Project Service Integration Plan

## Overview
This document outlines the comprehensive plan to update the project service integration following the auth and profile service changes, focusing on resilience, performance, and real-time capabilities.

## Current Issues & Solutions

### 1. Profile Service Dependency Risk
**Issue**: Project service depends on profile service for `collegeId` and `department`. If profile service is down → Project service breaks.

**Solution**: Move static identifiers into JWT claims for resilience.

### 2. Data Consistency with Auth Service Changes  
**Issue**: `displayName` moved to Auth service, but project service still calls profile service.

**Solution**: Establish single source of truth - Auth service for identity, Profile service for enrichment.

### 3. Avatar & Display Name Handling
**Issue**: Multiple fallback sources create inconsistencies.

**Solution**: Standardize on auth service as primary source for identity fields.

### 4. Real-Time Project Updates
**Issue**: Students must refresh to see new projects.

**Solution**: Implement WebSocket for real-time project rendering.

## Implementation Plan

### Phase 1: Core Resilience (High Priority)

#### 1.1 Update JWT Payload Structure
**Target**: Auth Service JWT generation
**Change**: Add nested profile object to JWT payload

```json
{
  "sub": "user123",
  "email": "user@college.edu",
  "roles": ["STUDENT"],
  "profile": {
    "collegeId": "college456",
    "department": "Computer Science",
    "year": 3
  }
}
```

**Benefits**:
- Reduces dependency on profile service for critical data
- Cleaner separation of concerns
- Easier to extend with additional stable fields

#### 1.2 Create Auth Service Client
**Target**: Project Service
**Files**: `src/clients/auth.ts`

```typescript
// New auth service client for identity data
export async function getUserIdentity(userId: string, authHeader: string): Promise<{
  displayName: string;
  avatarUrl?: string;
  email: string;
}> {
  const res = await fetch(`${env.AUTH_BASE_URL}/v1/users/${userId}`, {
    headers: { Authorization: authHeader }
  });
  return res.json();
}
```

#### 1.3 Update Project Service Logic
**Target**: Project Service routes and profile client
**Changes**:
- JWT-first approach for `collegeId`, `department`, `year`
- Auth service for `displayName`, `avatarUrl`
- Profile service only for bio, skills, social links

**Updated Priority**:
```typescript
// OLD: Multiple fallbacks
const authorName = tokenName ?? nameFromProfile ?? "";
const authorAvatar = tokenAvatar ?? avatarFromProfile ?? null;

// NEW: JWT + Auth service first
const { profile } = payload; // From JWT
const collegeId = profile?.collegeId;
const department = profile?.department;
const authorName = payload.displayName ?? tokenName ?? "";
const authorAvatar = payload.avatarUrl ?? tokenAvatar ?? null;
```

#### 1.4 Backward Compatibility
**Duration**: 1-2 weeks during rollout
**Approach**: Support both old and new JWT structures

```typescript
// Fallback for old tokens without profile object
const collegeId = payload.profile?.collegeId ?? await getFromProfileService();
```

### Phase 2: Performance & UX (Medium Priority)

#### 2.1 Redis Cache Implementation
**Target**: Project Service caching layer
**Configuration**:
- **Duration**: 30 minutes TTL
- **Background Refresh**: Every 25 minutes
- **Fallback**: In-memory cache for development

```typescript
// Redis cache with background refresh
const cacheKey = `user_scope:${userId}`;
const cached = await redis.get(cacheKey);
if (cached) return JSON.parse(cached);

// Background refresh when 80% of TTL elapsed
if (shouldRefreshInBackground(cacheKey)) {
  refreshUserScopeInBackground(userId);
}
```

#### 2.2 WebSocket Real-Time Updates
**Target**: Project Service + Frontend
**Architecture**: Reuse existing Socket.IO from message service
**Room Structure**:
- College-based rooms: `projects:${collegeId}`
- Optional department filtering: `projects:${collegeId}:${department}`

**Backend Implementation**:
```typescript
// When faculty posts new project
io.to(`projects:${collegeId}`).emit('new-project', {
  project: createdProject,
  departments: project.departments
});
```

**Frontend Integration**:
```typescript
// Subscribe to college-specific project updates
useEffect(() => {
  socket.join(`projects:${user.collegeId}`);
  socket.on('new-project', (data) => {
    if (data.departments.includes(user.department) || data.project.visibleToAllDepts) {
      setProjects(prev => [data.project, ...prev]);
    }
  });
  return () => socket.off('new-project');
}, []);
```

#### 2.3 Frontend Auto-Refresh
**Target**: Project Market page
**Features**:
- Real-time project additions
- Department-based filtering
- Toast notifications for new relevant projects

### Phase 3: Testing & Validation (Low Priority)

#### 3.1 Integration Testing
**Scope**:
- JWT payload validation
- Auth service client functionality
- WebSocket room subscriptions
- Cache invalidation scenarios

#### 3.2 Performance Monitoring
**Metrics**:
- Cache hit rates
- WebSocket connection stability
- Service dependency response times
- Real-time update latency

## Migration Timeline

### Week 1: JWT & Auth Client
- [ ] Update auth service JWT generation
- [ ] Create auth service client in project service
- [ ] Deploy with backward compatibility

### Week 2: Project Service Updates
- [ ] Update project service to use JWT-first approach
- [ ] Remove profile service fallbacks for identity data
- [ ] Test integration thoroughly

### Week 3: Performance Layer
- [ ] Implement Redis cache with background refresh
- [ ] Add WebSocket integration for real-time updates
- [ ] Update frontend for auto-refresh

### Week 4: Validation & Cleanup
- [ ] End-to-end testing
- [ ] Remove backward compatibility code
- [ ] Performance optimization

## Data Flow Diagrams

### Current Flow (Before Changes)
```
Project Service → Profile Service → Auth Service (for user fields)
                ↓
              Database (Profile + User data mixed)
```

### New Flow (After Changes)
```
Project Service → JWT (collegeId, department, year)
                → Auth Service (displayName, avatarUrl)
                → Profile Service (bio, skills, social links only)
                ↓
              Database (Clean separation)
```

## Risk Mitigation

### Service Downtime
- **JWT payload** provides critical data even if services are down
- **Redis cache** with extended TTL reduces external calls
- **Graceful degradation** when WebSocket is unavailable

### Data Consistency
- **Single source of truth** for each data type
- **Background refresh** keeps cache synchronized
- **Real-time updates** ensure immediate consistency

### Performance Impact
- **Reduced API calls** through JWT and caching
- **Optimized WebSocket rooms** prevent unnecessary broadcasts
- **Background processing** for non-critical updates

## Success Metrics

### Resilience
- 99.9% uptime even during profile service maintenance
- < 100ms response time for project listings
- Zero data inconsistencies between services

### User Experience
- Real-time project updates without page refresh
- < 2 second project market load time
- Seamless experience during service updates

### Developer Experience
- Clear separation of concerns between services
- Simplified debugging with single source of truth
- Comprehensive error handling and logging
