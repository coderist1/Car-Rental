# Web Components Documentation

This project uses native Web Components (Custom Elements) to create reusable, encapsulated UI components.

## Components

### 1. `app-header`
**File:** `web/components/app-header.js`

A reusable header component with logo, title, and subtitle.

**Attributes:**
- `logo` - Emoji or text for the logo (default: 🚗)
- `title` - Main title text (default: "CarRental")
- `subtitle` - Subtitle text (default: "Find your perfect ride")

**Usage:**
```html
<script type="module" src="components/app-header.js"></script>

<app-header 
    logo="🚗" 
    title="Car Rental" 
    subtitle="Find your perfect ride">
</app-header>
```

### 2. `auth-form`
**File:** `web/components/auth-form.js`

A reusable authentication form component for login/register pages.

**Attributes:**
- `type` - Form type: "login" or "register" (default: "login")
- `title` - Form title (default: "Welcome Back")
- `subtitle` - Form subtitle (default: "Sign in to your account")
- `admin` - Add this attribute for admin login styling

**Events:**
- `auth-submit` - Fired when form is submitted
  - `detail.email` - Email entered
  - `detail.password` - Password entered
  - `detail.isAdmin` - Boolean indicating if admin form

**Methods:**
- `showError(message)` - Display an error message

**Usage:**
```html
<script type="module" src="../components/auth-form.js"></script>

<auth-form 
    type="login"
    title="Welcome Back"
    subtitle="Sign in to your account">
</auth-form>

<script>
    document.querySelector('auth-form').addEventListener('auth-submit', (e) => {
        const { email, password } = e.detail;
    });
</script>
```

### 3. `vehicle-card`
**File:** `web/components/vehicle-card.js`

A reusable vehicle card component for displaying vehicle information.

**Attributes:**
- `vehicle-id` - Unique vehicle identifier
- `name` - Vehicle name
- `type` - Vehicle type (SUV, Sedan, etc.)
- `price` - Price per day
- `image` - Image URL
- `location` - Location (optional)
- `seats` - Number of seats (optional)
- `transmission` - Transmission type (optional)
- `mode` - Display mode: "renter" or "owner" (default: "renter")

**Events:**
- `vehicle-click` - Fired when card is clicked
  - `detail.vehicleId` - ID of clicked vehicle
- `vehicle-action` - Fired when action button is clicked
  - `detail.action` - Action type: "view", "edit", or "delete"
  - `detail.vehicleId` - ID of vehicle
  - `detail.vehicleData` - Vehicle data object

**Usage:**
```html
<script type="module" src="../components/vehicle-card.js"></script>

<vehicle-card 
    vehicle-id="1"
    name="BMW X5"
    type="SUV"
    price="5500"
    image="https://example.com/image.jpg"
    location="Makati"
    seats="5"
    transmission="Automatic"
    mode="owner">
</vehicle-card>

<script>
    document.querySelector('vehicle-card').addEventListener('vehicle-action', (e) => {
        const { action, vehicleId } = e.detail;
        if (action === 'edit') {
        } else if (action === 'delete') {
        }
    });
</script>
```

**Dynamic Creation:**
```javascript
const card = document.createElement('vehicle-card');
card.setAttribute('vehicle-id', vehicle.id);
card.setAttribute('name', vehicle.name);
card.setAttribute('type', vehicle.type);
card.setAttribute('price', vehicle.price);
card.setAttribute('image', vehicle.image);
card.setAttribute('mode', 'owner');

card.addEventListener('vehicle-action', (e) => {
    console.log('Action:', e.detail.action);
});

container.appendChild(card);
```

### 4. `confirm-modal`
**File:** `web/components/confirm-modal.js`

A reusable confirmation modal component with Yes/No buttons.

**Attributes:**
- `open` - Set this attribute to show the modal

**Methods:**
- `show(message)` - Show modal with custom message, returns a Promise
  - Returns `true` if Yes is clicked
  - Returns `false` if No is clicked
- `close(result)` - Close modal with result

**Usage:**
```html
<script type="module" src="../components/confirm-modal.js"></script>

<confirm-modal id="confirm-modal"></confirm-modal>

<script>
    async function deleteItem() {
        const modal = document.getElementById('confirm-modal');
        const confirmed = await modal.show('Are you sure you want to delete?');
        
        if (confirmed) {
            console.log('Deleting...');
        } else {
            console.log('Cancelled');
        }
    }
</script>
```

## Benefits of Web Components

1. **Encapsulation** - Components have their own Shadow DOM, preventing style conflicts
2. **Reusability** - Components can be used across multiple pages
3. **Maintainability** - Changes to components automatically apply everywhere they're used
4. **No Build Step** - Native browser support, no bundler needed
5. **Framework Agnostic** - Can be used with or without frameworks

## Browser Support

Web Components (Custom Elements, Shadow DOM) are supported in all modern browsers:
- Chrome/Edge 54+
- Firefox 63+
- Safari 10.1+

## Implementation Notes

- All components are ES modules (use `type="module"` when importing)
- Components use Shadow DOM for style encapsulation
- Event communication uses CustomEvents with `bubbles: true, composed: true`
- Components are framework-independent and work with vanilla JavaScript
