# Image Management API Documentation

## Overview

The image management system for Houses and Lands now supports granular control over image updates with the following capabilities:

- ✅ **Keep old images** - Retain existing images without changes
- ✅ **Add new images** - Upload and add new images
- ✅ **Delete selected images** - Remove specific images by ID
- ✅ **Reorder images** - Change the display order
- ✅ **Update captions** - Modify image captions
- ✅ **Set primary** - Mark which image is primary

## DTOs

### For Houses

#### `ManageHouseImagesDto`
Located in: `src/houses/dto/manage-house-images.dto.ts`

```typescript
{
  keep?: UpdateImageDataDto[];      // Images to keep with optional updates
  delete?: string[];                // Image IDs to delete
  newImageDetails?: NewImageDetailDto[]; // Metadata for new images
}
```

**UpdateImageDataDto**
```typescript
{
  id: string;              // Existing image ID (required)
  caption?: string;        // Updated caption
  isPrimary?: boolean;     // Is this the primary image?
  order?: number;          // Display order
}
```

**NewImageDetailDto**
```typescript
{
  caption?: string;        // Caption for new image
  isPrimary?: boolean;     // Is this the primary image?
  order?: number;          // Display order
}
```

### For Lands

#### `ManageLandImagesDto`
Located in: `src/lands/dto/manage-land-images.dto.ts`

```typescript
{
  keep?: UpdateLandImageDataDto[];      // Images to keep with optional updates
  delete?: string[];                    // Image IDs to delete
  newImageDetails?: NewLandImageDetailDto[]; // Metadata for new images
}
```

**UpdateLandImageDataDto** and **NewLandImageDetailDto** follow the same structure as houses.

## Usage Examples

### Example 1: Keep Old Images and Add New Ones

**Request:**
```json
{
  "manageImages": {
    "keep": [
      {
        "id": "image-id-1",
        "caption": "Updated caption",
        "order": 1
      }
    ],
    "newImageDetails": [
      {
        "caption": "New image caption",
        "order": 2,
        "isPrimary": false
      }
    ]
  }
}
```

**With Files:**
- Upload 1 new image file via multipart/form-data

---

### Example 2: Delete Selected Images and Reorder

**Request:**
```json
{
  "manageImages": {
    "keep": [
      {
        "id": "image-id-1",
        "order": 1
      },
      {
        "id": "image-id-3",
        "order": 2
      }
    ],
    "delete": ["image-id-2"]
  }
}
```

---

### Example 3: Update Captions and Set Primary

**Request:**
```json
{
  "manageImages": {
    "keep": [
      {
        "id": "image-id-1",
        "caption": "Main entrance",
        "isPrimary": true
      },
      {
        "id": "image-id-2",
        "caption": "Side view",
        "isPrimary": false
      },
      {
        "id": "image-id-3",
        "caption": "Rear view",
        "isPrimary": false
      }
    ]
  }
}
```

---

### Example 4: Complete Image Management

**Request:**
```json
{
  "manageImages": {
    "keep": [
      {
        "id": "image-id-1",
        "caption": "Updated main entrance",
        "isPrimary": true,
        "order": 1
      }
    ],
    "delete": ["image-id-2", "image-id-4"],
    "newImageDetails": [
      {
        "caption": "New side view",
        "order": 2
      },
      {
        "caption": "New rear view",
        "order": 3
      }
    ]
  }
}
```

**With Files:**
- Upload 2 new image files via multipart/form-data

---

## How It Works

### 1. Keep Old Images
- Existing images are retained by providing their IDs in the `keep` array
- Any metadata can be updated (caption, order, isPrimary)
- Images not mentioned in `keep` or `delete` arrays will be kept as-is

### 2. Add New Images
- Upload files via multipart/form-data
- Provide metadata in `newImageDetails` array (indices match file upload order)
- New images are automatically assigned sequential order numbers

### 3. Delete Images
- Provide image IDs in the `delete` array
- Images are deleted from both database and Cloudinary

### 4. Reorder Images
- Update the `order` property in the `keep` array
- Order is preserved when images are retrieved

### 5. Update Captions
- Include `caption` in the image object within the `keep` array
- `null` can be passed to remove a caption

### 6. Set Primary
- Set `isPrimary: true` on one image
- Other images should have `isPrimary: false`
- Only one image should be marked as primary

## Service Implementation Details

The `update()` method in both `houses.service.ts` and `lands.service.ts`:

1. **Fetches** existing house/land with all images
2. **Processes** the `manageImages` DTO:
   - Identifies images to keep and update
   - Identifies images to delete (and removes from Cloudinary)
   - Prepares new images for upload
3. **Performs** the main update with image deletions
4. **Applies** additional image operations (creates and metadata updates)
5. **Returns** updated house/land with all images sorted by order

## Migration from Old Format

### Old Format (Replaced All Images)
```typescript
// This replaced ALL images
updateData.images = {
  deleteMany: {},
  create: newImages
}
```

### New Format (Granular Control)
```typescript
// This gives granular control
updateData.manageImages = {
  keep: [...existing images to keep],
  delete: [...image ids to delete],
  newImageDetails: [...metadata for new images]
}
```

## Important Notes

- The `order` property should be unique for all images belonging to one property
- If `order` is not provided for new images, it's auto-calculated based on existing images
- Image deletion from Cloudinary is atomic - if an error occurs, both database and Cloudinary states remain consistent
- The response includes all updated images sorted by order
