# QR Ticket System - Branch 2: In-App QR Scanner (Advanced Enhancement)

## Overview
Advanced in-app QR scanning functionality that provides seamless staff workflows, offline capabilities, and enhanced user experience. This branch builds upon Branch 1's foundation.

## Branch: `feature/in-app-qr-scanner`

## Prerequisites
- Branch 1 (`feature/qr-tickets-url-scanning`) must be completed and merged
- QR token system and unified check-in service already in place
- JWT-based scan validation already implemented

## Advanced Scanner Strategy
- In-app camera integration using `jsqr`
- Offline scanning capabilities with sync
- Advanced error handling and validation
- Enhanced UX for staff workflows
- Continuous scanning mode for efficiency

## Phase 1: Camera Integration (TDD)

### Tasks:
- Install `jsqr`, `@types/jsqr`, and camera access libraries
- **Write tests** for camera permission handling
- **Write tests** for QR decode functionality
- **Write tests** for error scenarios (no camera, permissions denied)
- **Commit:** "Add tests for in-app QR scanning"
- **Implement:** Camera access and QR scanning React component
- **Implement:** Real-time QR detection and validation
- **Implement:** Permission request flow with clear messaging
- **Verify:** Camera works across different devices and browsers
- **Commit:** "Implement in-app QR scanner component"

### Technical Implementation:
```typescript
// QR Scanner Component Structure
interface QRScannerProps {
  onScan: (token: string) => void;
  onError: (error: string) => void;
  isActive: boolean;
}

// Camera permissions handling
const requestCameraPermission = async () => {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ video: true });
    return { success: true, stream };
  } catch (error) {
    return { success: false, error: error.message };
  }
};
```

### Dependencies to Add:
```json
{
  "jsqr": "^1.4.0",
  "@types/jsqr": "^1.4.0"
}
```

## Phase 2: Enhanced Run Sheet Integration (TDD)

### Tasks:
- **Write tests** for seamless scanner integration with existing Run Sheet
- **Write tests** for batch scanning workflows
- **Write tests** for scanner state management
- **Commit:** "Add tests for enhanced Run Sheet scanner"
- **Implement:** Replace manual token entry with integrated camera scanner
- **Implement:** Continuous scanning mode for staff efficiency
- **Implement:** Scanner overlay with scan area indicators
- **Implement:** Audio/haptic feedback for successful scans
- **Verify:** Scanning workflow is faster and more intuitive than manual entry
- **Commit:** "Replace manual entry with in-app QR scanner"

### UX Enhancements:
- **Scanner Overlay:** Visual scan area with corner markers
- **Real-time Feedback:** Green highlight on successful QR detection
- **Batch Mode:** Continuous scanning without stopping
- **Auto-focus:** Automatic camera focus optimization
- **Torch Control:** Toggle flashlight for low-light conditions

## Phase 3: Offline & Performance Optimization (TDD)

### Tasks:
- **Write tests** for offline scanning capabilities
- **Write tests** for local storage and sync mechanisms
- **Write tests** for performance under rapid scanning load
- **Write tests** for network reconnection handling
- **Commit:** "Add tests for offline and performance features"
- **Implement:** Local caching for offline validation
- **Implement:** Queue system for scans when offline
- **Implement:** Bulk sync when connection restored
- **Implement:** Performance optimizations for rapid scanning
- **Implement:** Conflict resolution for duplicate offline scans
- **Verify:** Works reliably in poor network conditions
- **Commit:** "Add offline scanning and performance optimizations"

### Offline Architecture:
```typescript
// Offline Queue Structure
interface OfflineScan {
  id: string;
  token: string;
  timestamp: number;
  bookingId: string;
  ticketIndex: number;
  venue: string;
  synced: boolean;
}

// Sync Strategy
const syncOfflineScans = async () => {
  const pendingScans = await getOfflineScans();
  for (const scan of pendingScans) {
    try {
      await submitScan(scan);
      await markScanAsSynced(scan.id);
    } catch (error) {
      // Handle sync conflicts
      await handleSyncConflict(scan, error);
    }
  }
};
```

## Phase 4: Advanced Error Handling & Validation (TDD)

### Tasks:
- **Write tests** for comprehensive error scenarios
- **Write tests** for invalid QR code handling
- **Write tests** for expired token scenarios
- **Write tests** for wrong venue validation
- **Commit:** "Add tests for advanced error handling"
- **Implement:** Smart error recovery and suggestions
- **Implement:** Detailed error messages with next steps
- **Implement:** Auto-retry mechanisms for temporary failures
- **Implement:** Advanced validation with business rules
- **Verify:** Error handling covers all edge cases
- **Commit:** "Implement comprehensive error handling and validation"

### Error Scenarios Covered:
- **Camera Issues:** No camera, permissions denied, hardware failure
- **QR Code Issues:** Invalid format, expired tokens, corrupted data
- **Business Logic:** Wrong venue, already scanned, cancelled bookings
- **Network Issues:** Offline mode, slow connections, timeouts
- **Sync Conflicts:** Duplicate scans, timestamp conflicts

## Phase 5: Staff Workflow Optimization (TDD)

### Tasks:
- **Write tests** for workflow efficiency features
- **Write tests** for keyboard shortcuts and accessibility
- **Write tests** for staff performance analytics
- **Commit:** "Add tests for workflow optimization features"
- **Implement:** Keyboard shortcuts for power users
- **Implement:** Scan statistics and performance tracking
- **Implement:** Quick actions (mark as VIP, add notes)
- **Implement:** Accessibility features for different abilities
- **Verify:** Staff can process guests faster than manual methods
- **Commit:** "Add workflow optimization and accessibility features"

### Workflow Features:
- **Quick Stats:** Scans per minute, success rate, error frequency
- **Shortcuts:** Space to toggle scanner, Enter to retry, Esc to close
- **Accessibility:** Screen reader support, high contrast mode
- **Analytics:** Track staff efficiency and identify bottlenecks

## Performance Requirements

### Scanning Performance:
- **Scan Detection:** < 500ms from QR code appearance to recognition
- **Validation:** < 200ms for token validation and booking lookup
- **UI Feedback:** < 100ms for visual/audio confirmation
- **Camera Startup:** < 2s from component mount to active scanning

### Offline Performance:
- **Local Storage:** Support for 10,000+ offline scans
- **Sync Speed:** Process 100+ queued scans per minute
- **Conflict Resolution:** Handle duplicate scans within 1s

## Browser Compatibility

### Supported Browsers:
- **Chrome/Edge:** Full feature support including camera API
- **Safari:** Full support with iOS 14.3+ camera improvements
- **Firefox:** Full support with recent versions
- **Mobile Browsers:** Optimized for iOS Safari and Android Chrome

### Fallback Strategy:
- **No Camera:** Graceful degradation to manual token entry
- **Old Browsers:** Detect capabilities and show appropriate UI
- **Permissions Denied:** Clear instructions for enabling camera access

## Security Considerations

### Camera Access:
- **Minimal Permissions:** Request only necessary camera access
- **No Recording:** Ensure no video/image data is stored
- **Privacy Notice:** Clear explanation of camera usage

### Token Validation:
- **JWT Security:** Validate signatures and expiration
- **Rate Limiting:** Prevent rapid-fire scanning attacks
- **Audit Logging:** Track all scan attempts for security

## Success Criteria

✅ In-app scanning is faster than manual token entry  
✅ Works offline with reliable sync when connected  
✅ Handles rapid scanning for large events (>100 guests/hour)  
✅ Provides superior UX for daily staff workflows  
✅ Camera startup and QR detection under 3 seconds total  
✅ Error recovery is intuitive with clear next steps  
✅ Accessibility features support all staff members  
✅ Performance analytics help optimize venue operations  

## Files to Create/Modify

### New Components:
- `src/components/scanning/QRScanner.tsx` - Main scanner component
- `src/components/scanning/ScannerOverlay.tsx` - Visual scan area
- `src/components/scanning/OfflineQueue.tsx` - Queue management
- `src/hooks/useQRScanner.ts` - Scanner state management
- `src/hooks/useOfflineScans.ts` - Offline functionality

### Enhanced Files:
- `src/pages/RunSheet.tsx` - Integrate scanner component
- `src/services/checkInService.ts` - Add offline queue support
- `src/utils/scanValidation.ts` - Enhanced validation logic

### Testing Files:
- `src/components/scanning/__tests__/` - Component tests
- `src/hooks/__tests__/` - Hook tests
- `cypress/integration/scanning/` - E2E tests

## Migration Strategy

### Rollout Plan:
1. **Feature Flag:** Deploy behind feature flag for gradual rollout
2. **Staff Training:** Provide training sessions for new scanning workflow
3. **Pilot Testing:** Test with select venues before full deployment
4. **Gradual Migration:** Enable for all venues over 1-2 weeks
5. **Monitoring:** Track performance and user feedback closely

### Rollback Plan:
- **Instant Fallback:** Manual token entry always available
- **Feature Toggle:** Disable scanner via feature flag if issues arise
- **Data Safety:** All scans work with Branch 1's validation system