# Image Management - Practical Examples

## Quick Reference

### Keep Images with Updates
```json
{
  "manageImages": {
    "keep": [
      {
        "id": "img-001",
        "caption": "Main entrance",
        "order": 1,
        "isPrimary": true
      },
      {
        "id": "img-002",
        "caption": "Living room",
        "order": 2
      }
    ]
  }
}
```

### Delete Specific Images
```json
{
  "manageImages": {
    "delete": ["img-005", "img-007"]
  }
}
```

### Add New Images Only
```json
{
  "manageImages": {
    "newImageDetails": [
      {
        "caption": "New kitchen photo",
        "order": 3
      },
      {
        "caption": "Updated bedroom",
        "order": 4,
        "isPrimary": false
      }
    ]
  }
}
```

With files: Upload 2 image files

### Reorder Images
```json
{
  "manageImages": {
    "keep": [
      { "id": "img-003", "order": 1 },
      { "id": "img-001", "order": 2 },
      { "id": "img-002", "order": 3 }
    ]
  }
}
```

### Update Captions Only
```json
{
  "manageImages": {
    "keep": [
      {
        "id": "img-001",
        "caption": "Updated: Master bedroom"
      },
      {
        "id": "img-002",
        "caption": "Updated: Guest room"
      }
    ]
  }
}
```

### Set New Primary Image
```json
{
  "manageImages": {
    "keep": [
      {
        "id": "img-001",
        "isPrimary": false
      },
      {
        "id": "img-003",
        "isPrimary": true
      },
      {
        "id": "img-005"
      }
    ]
  }
}
```

---

## Complex Real-World Scenarios

### Scenario 1: Update Product with Full Image Refresh
**Goal**: Keep favorite images, delete 2 old ones, add 3 new ones, reorder everything

```json
{
  "title": "Premium Residential Complex",
  "location": "New Address",
  "manageImages": {
    "keep": [
      {
        "id": "img-001",
        "caption": "Main lobby - Updated",
        "order": 1,
        "isPrimary": true
      },
      {
        "id": "img-004",
        "caption": "Swimming pool area - Updated",
        "order": 3
      }
    ],
    "delete": ["img-002", "img-005"],
    "newImageDetails": [
      {
        "caption": "New aerial view",
        "order": 2
      },
      {
        "caption": "New gym facility",
        "order": 4
      },
      {
        "caption": "New parking area",
        "order": 5
      }
    ]
  }
}
```

**Files to upload**: 3 image files (matching newImageDetails order)

### Scenario 2: Delete Old Images and Update Remaining
**Goal**: Remove low-quality images, update captions on remaining ones

```json
{
  "manageImages": {
    "keep": [
      {
        "id": "img-001",
        "caption": "Professional exterior shot",
        "order": 1,
        "isPrimary": true
      },
      {
        "id": "img-003",
        "caption": "Interior hallway",
        "order": 2
      },
      {
        "id": "img-008",
        "caption": "Garden area",
        "order": 3
      }
    ],
    "delete": ["img-002", "img-004", "img-006", "img-007"]
  }
}
```

**Files to upload**: None (only keeping and deleting)

### Scenario 3: Add New Images to Existing Gallery
**Goal**: Keep all current images unchanged, add 2 new ones

```json
{
  "manageImages": {
    "newImageDetails": [
      {
        "caption": "Recently renovated kitchen",
        "isPrimary": false
      },
      {
        "caption": "New outdoor patio",
        "isPrimary": false
      }
    ]
  }
}
```

**Files to upload**: 2 image files

**Note**: No `keep` array means all existing images are retained with their current metadata

### Scenario 4: Reorder Complete Gallery
**Goal**: Reorganize all images in new sequence

```json
{
  "manageImages": {
    "keep": [
      { "id": "img-008", "order": 1 },
      { "id": "img-001", "order": 2 },
      { "id": "img-003", "order": 3 },
      { "id": "img-004", "order": 4 },
      { "id": "img-009", "order": 5 }
    ]
  }
}
```

**Files to upload**: None

### Scenario 5: Rotate Primary Image and Minor Updates
**Goal**: Change which image is primary, update some captions

```json
{
  "manageImages": {
    "keep": [
      {
        "id": "img-001",
        "caption": "Side view",
        "isPrimary": false
      },
      {
        "id": "img-003",
        "caption": "Front main entrance",
        "isPrimary": true
      },
      {
        "id": "img-004",
        "caption": "Backyard with pool"
      },
      {
        "id": "img-007"
      }
    ]
  }
}
```

**Files to upload**: None

---

## Frontend Integration Guide

### 1. Prepare Your Data

```javascript
// User selections on frontend
const imagesToKeep = [
  { id: 'img-001', caption: 'Updated caption', order: 1, isPrimary: true },
  { id: 'img-003', order: 2 }
];

const imagesToDelete = ['img-002', 'img-005'];

const newFiles = [...]; // File objects
const newImageMetadata = [
  { caption: 'New image 1', order: 3 },
  { caption: 'New image 2', order: 4 }
];
```

### 2. Build Form Data

```javascript
const formData = new FormData();

// Add JSON data
formData.append('manageImages', JSON.stringify({
  keep: imagesToKeep,
  delete: imagesToDelete,
  newImageDetails: newImageMetadata
}));

// Add new image files
newFiles.forEach(file => {
  formData.append('image', file);
});

// Add other fields
formData.append('title', 'Updated Title');
formData.append('location', 'Updated Location');
```

### 3. Send Request

```javascript
// For Houses
const response = await fetch(`/api/houses/${houseId}`, {
  method: 'PUT',
  body: formData
  // Don't set Content-Type header - browser will set it automatically
});

// For Lands
const response = await fetch(`/api/lands/${landId}`, {
  method: 'PUT',
  body: formData
});

const result = await response.json();
```

### 4. Handle Response

```javascript
if (result.success) {
  // Update UI with new images
  const updatedImages = result.data.images;
  updateImageGallery(updatedImages);
} else {
  console.error('Error:', result.message);
}
```

---

## Important Notes

### File Upload Order
- Files are processed in the order they appear in FormData
- Each file pairs with corresponding index in `newImageDetails` array
- Example: If you upload 2 files and provide 2 metadata objects, file[0] → newImageDetails[0]

### Order Assignment
- If `order` is not provided in `keep` array, image retains its current order
- If `order` is not provided in `newImageDetails`, auto-assigned based on max existing order
- Always provide `order` for consistent results

### Primary Image
- Only one image should have `isPrimary: true`
- Others should have `isPrimary: false` or omit the property
- System doesn't prevent multiple primary images, but frontend should enforce this

### Cloudinary Sync
- Deleted images are removed from Cloudinary immediately
- Failed deletions don't roll back database changes
- Keep public_id on backend for recovery if needed

### Performance
- Batch operations are optimized internally
- Large number of images (100+) may take longer
- Consider pagination for gallery display

### Error Handling
- If file upload fails, transaction is rolled back
- Slug conflicts still return 409 Conflict
- Invalid image IDs in `keep` array are silently ignored
- Invalid image IDs in `delete` array are silently ignored (no error)

---

## Troubleshooting

### Q: Order values don't seem to work
**A**: Make sure you're providing `order` as a number, not string. If omitted, auto-increment is used.

### Q: Multiple images marked as primary
**A**: Backend doesn't enforce single primary. Ensure frontend prevents this before sending.

### Q: Images not appearing in order
**A**: Images are always returned sorted by `order` ASC. Check your order values.

### Q: File upload showing in request but images not created
**A**: Ensure `newImageDetails` array length matches number of files uploaded.

### Q: Getting Slug already exists error
**A**: If updating title, ensure new slug is unique. Can be fixed by checking existing slugs first.
