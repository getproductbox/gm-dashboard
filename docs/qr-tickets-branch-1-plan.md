# QR Ticket System - Branch 1: URL-Based Scanning (Simplified MVP)

## Overview
Implement digital QR tickets with URL-based scanning using phone's native camera app. This approach leverages existing infrastructure and provides immediate value with minimal complexity.

## Branch: `feature/qr-tickets-url-scanning`

## Simplified Strategy
- Extend existing `ticket_checkins` JSONB instead of new database columns
- Use external QR API initially (zero dependencies)
- JWT-based scan URLs for authentication-free scanning
- Progressive enhancement approach

## Phase 1: Token System & Database (TDD)

### Tasks:
- **Write tests** for token generation (JWT with booking data + expiry)
- **Write tests** for extending `ticket_checkins` JSONB structure
- **Commit:** "Add tests for simplified QR token system"
- **Implement:** JWT token service with booking payload
- **Implement:** Enhance existing `updateVipTicketCheckins()` to handle token data
- **Verify:** Token generation and JSONB updates work
- **Commit:** "Implement simplified QR token system using existing schema"

### Technical Details:
```json
JWT Token Structure:
{
  "booking_id": "uuid",
  "ticket_index": 0,
  "venue": "manor", 
  "exp": 1640995200,
  "iat": 1640908800
}

Enhanced ticket_checkins JSONB:
[
  {
    "scanned_at": "2023-10-01T10:00:00Z",
    "token": "jwt-token-here",
    "method": "qr_scan",
    "scanned_by": "staff-user-id"
  },
  {
    "scanned_at": null,
    "token": "jwt-token-here", 
    "method": null,
    "scanned_by": null
  }
]
```

## Phase 2: Scan Endpoint (TDD)

### Tasks:
- **Write tests** for `/scan/{jwt-token}` endpoint
- **Write tests** for JWT validation and booking resolution
- **Write tests** for duplicate scan prevention
- **Commit:** "Add tests for auth-free scan endpoint"
- **Implement:** Simple scan route returning basic HTML success page
- **Implement:** JWT validation without requiring active auth session
- **Implement:** Basic scan result page with minimal JavaScript
- **Verify:** Scan endpoint works without authentication
- **Commit:** "Add simple scan endpoint with JWT validation"

### URL Format:
```
https://gm-dashboard.getproductbox.com/scan/{jwt-token}
```

## Phase 3: QR Generation & Email Integration (Simplified)

### Tasks:
- **Write tests** for QR URL generation using external API
- **Write tests** for email template integration
- **Commit:** "Add tests for external QR API integration"
- **Implement:** QR generation using `https://api.qrserver.com/v1/create-qr-code/`
- **Implement:** Update existing email templates with QR image URLs
- **Verify:** QR codes generate and emails render correctly
- **Commit:** "Add QR codes to emails using external API"

### QR API Usage:
```
QR API: https://api.qrserver.com/v1/create-qr-code/?size=200x200&data={encoded-url}
```

## Phase 4: Run Sheet Integration (Minimal)

### Tasks:
- **Write tests** for manual token entry on existing Run Sheet
- **Write tests** for unified check-in service (manual + QR)
- **Commit:** "Add tests for unified check-in system"
- **Implement:** Add "Enter QR Code" input field to existing Run Sheet
- **Implement:** Unified check-in service handling both methods
- **Implement:** Toast notifications for scan feedback
- **Verify:** Both manual and QR check-ins update same data structure
- **Commit:** "Add QR token entry to existing Run Sheet interface"

## Phase 5: Mobile Polish (Progressive Enhancement)

### Tasks:
- **Write tests** for mobile browser compatibility
- **Commit:** "Add tests for mobile scanning experience"  
- **Implement:** Mobile-optimized scan result pages
- **Implement:** Optional auto-close JavaScript (graceful fallback)
- **Implement:** "Return to camera" messaging
- **Verify:** Works across major mobile browsers
- **Commit:** "Add mobile optimization with progressive enhancement"

## Key Simplifications Made

### Reduced Complexity:
- ✅ **No new database columns** - extends existing `ticket_checkins`
- ✅ **Zero dependencies initially** - uses external QR API
- ✅ **No complex arrays** - single JSONB structure
- ✅ **Auth-free scanning** - JWT contains all needed data
- ✅ **Progressive enhancement** - works without JavaScript

### Faster Implementation:
- ✅ **Fewer commits** - combined related functionality
- ✅ **Leverages existing code** - builds on current Run Sheet
- ✅ **External QR service** - no library integration needed
- ✅ **Unified check-in service** - handles both methods

### Lower Risk:
- ✅ **No authentication complexity** - JWT handles auth
- ✅ **Fallback-ready** - manual entry always available
- ✅ **Browser-agnostic** - works on any mobile browser
- ✅ **Backward compatible** - existing check-ins unchanged

## Success Criteria

✅ QR codes in emails work with any phone camera app  
✅ Scanning checks in guests without requiring login  
✅ Manual token entry works as seamless fallback
✅ Existing Run Sheet functionality unchanged
✅ Mobile experience works across all major browsers

## Files to Modify

- `src/services/bookingService.ts` - Enhance with JWT token generation
- `src/pages/RunSheet.tsx` - Add manual token entry field
- `src/integrations/supabase/` - Add scan endpoint route
- Email templates in database - Add QR code sections
- `src/services/` - Create unified check-in service

## Dependencies

- **None initially** - uses external QR API
- JWT library (likely already available in project)
- Existing React/TypeScript infrastructure

## Testing Strategy

- **Unit Tests:** JWT token generation and validation
- **Integration Tests:** Scan endpoint and check-in service
- **Manual Testing:** QR scanning with various mobile devices
- **Email Testing:** QR code rendering in different email clients