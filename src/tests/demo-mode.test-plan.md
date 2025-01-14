# Demo Mode Test Plan

## 1. Order Visibility Tests

### Quick Queue Orders
1. Initial State Verification
   - Verify dashboard shows no current orders initially
   - Confirm order history is empty or shows demo data

2. Quick Queue Order Placement
   ```typescript
   // Test Steps
   1. Navigate to Menu
   2. Select items (one from each category)
   3. Open cart
   4. Enable Quick Queue
   5. Place order
   6. Verify in Dashboard
   ```

   Success Criteria:
   - Order appears immediately in "Current Orders"
   - Order status shows as "preparing"
   - Order details are accurate (items, time, location)
   - Quick Queue selected time slot is displayed

3. Multiple Quick Queue Orders
   ```typescript
   // Test Steps
   1. Place first order via Quick Queue
   2. Verify in dashboard
   3. Try to place second order same day
   4. Verify error message
   ```

   Success Criteria:
   - First order visible in dashboard
   - Second order blocked with "already ordered today" message

### Manual Selection Orders
1. Time Slot Selection
   ```typescript
   // Test Steps
   1. Navigate to Menu
   2. Select items
   3. Open cart
   4. Select date and time manually
   5. Place order
   6. Verify in Dashboard
   ```

   Success Criteria:
   - Order appears in "Current Orders"
   - Selected time slot is correctly displayed
   - All order details are accurate

2. Order Status Updates
   ```typescript
   // Test Data Structure
   interface DemoOrder {
     id: string;
     status: 'preparing' | 'completed';
     created_at: string;
     items: Array<{
       menu_item: {
         name: string;
       };
       quantity: number;
     }>;
     time_slot: {
       date: string;
       time: string;
       location: { name: string };
     };
   }
   ```

   Verify:
   - Orders start in "preparing" status
   - Orders move to "completed" when appropriate
   - Status changes reflect in UI immediately

### Local Storage Integration
1. Data Persistence
   ```typescript
   // Storage Keys
   const DEMO_ORDERS_KEY = 'demo_orders';
   const DEMO_LAST_ORDER_DATE = 'demo_last_order_date';
   ```

   Verify:
   - Orders are saved to localStorage
   - Orders persist after page refresh
   - Order data structure is maintained

2. Order History Integration
   ```typescript
   // Test Steps
   1. Place new order
   2. Verify localStorage update
   3. Check dashboard display
   4. Refresh page
   5. Verify order still visible
   ```

## 2. Pie Chart Label Tests

### Label Visibility
1. Chart Dimensions
   ```typescript
   // Test Configurations
   const chartConfigs = {
     width: '100%',
     height: '100%',
     outerRadius: 80,
     labelOffset: 10
   };
   ```

2. Label Positioning
   - Test with different percentage values
   - Verify no truncation occurs
   - Check label spacing and overlap

3. Responsive Behavior
   ```typescript
   // Test Viewports
   const viewports = [
     { width: 320, height: 568 },  // Mobile
     { width: 768, height: 1024 }, // Tablet
     { width: 1024, height: 768 }, // Laptop
     { width: 1920, height: 1080 } // Desktop
   ];
   ```

### Data Variations
1. Label Length Tests
   ```typescript
   const testData = [
     { name: 'Protein', value: 30 },
     { name: 'Carbohydrates', value: 40 },
     { name: 'Fats', value: 20 },
     { name: 'Fiber', value: 10 }
   ];
   ```

2. Percentage Tests
   - Test with single-digit percentages
   - Test with double-digit percentages
   - Test with 100% values

## Success Criteria

### Order Visibility
- [ ] Quick Queue orders appear immediately
- [ ] Manual selection orders display correctly
- [ ] Order details are accurate and complete
- [ ] Status updates reflect correctly
- [ ] Orders persist after refresh
- [ ] Multiple orders handled correctly
- [ ] Same-day order restriction works

### Pie Chart Display
- [ ] All labels fully visible
- [ ] No text truncation
- [ ] Proper spacing between labels
- [ ] Consistent display across screen sizes
- [ ] Readable at all percentage values

## Test Environment Setup

```typescript
// Local Storage Mock
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  clear: jest.fn()
};

// Demo Mode Helper
const enableDemoMode = () => {
  useAuthStore.setState({
    user: {
      id: 'demo-user',
      email: 'demo@example.com',
      isDemo: true
    }
  });
};
```

## Edge Cases

1. Order Placement
   - Network disconnection during order
   - Multiple rapid order attempts
   - Browser refresh during order
   - Local storage full/unavailable

2. Chart Display
   - Very long label text
   - Zero value segments
   - Single segment dominance
   - Minimum container size

## Regression Testing

1. Verify existing functionality:
   - Order history display
   - Time saved calculations
   - Status transitions
   - Dashboard updates

2. Integration points:
   - Cart interaction
   - Menu selection
   - Navigation flow
   - State management