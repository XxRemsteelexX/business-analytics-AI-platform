# InteractiveDataSelector Component Documentation

## Overview
The InteractiveDataSelector is a React component that provides an interactive interface for selecting and filtering data from spreadsheets or CSV files. It replaces traditional dropdown-based selection with a more intuitive checkbox-based interface that allows real-time data filtering and chart generation.

## Features

### ✅ Core Features
- **Checkbox-based Row Selection**: Select specific rows of data using checkboxes
- **Checkbox-based Column Selection**: Choose which columns to include in analysis
- **Column Value Filtering**: Filter specific values within each selected column
- **Real-time Updates**: Charts update instantly as selections change
- **Collapsible Sections**: All sections (Data Range, Rows, Columns) can be minimized/expanded
- **Data Range Slider**: Adjust the visible data range dynamically
- **Persistent Interface**: Selection interface remains visible after chart generation

## Component Structure

### Props
```typescript
interface InteractiveDataSelectorProps {
  fileData: {
    fileName: string
    sheets: Array<{
      name: string
      data: any[][]
    }>
  }
  onDataSelected: (data: {
    fileName: string
    sheetName: string
    data: any[]
    columnHeaders: string[]
  }) => void
}
```

### State Management
The component manages several state variables:
- `selectedRows`: Set of selected row indices
- `selectedColumns`: Set of selected column names
- `columnFilters`: Map of column filters with selected values
- `rangeSectionExpanded`: Boolean for Data Range section visibility
- `rowSectionExpanded`: Boolean for Row Selection section visibility
- `columnSectionExpanded`: Boolean for Column Selection section visibility
- `startIndex` & `endIndex`: Data range boundaries

## Usage Example

```jsx
import { InteractiveDataSelector } from '@/components/dashboard/InteractiveDataSelector'

function Dashboard() {
  const handleDataSelected = (data) => {
    console.log('Selected data:', data)
    // Generate charts with selected data
  }

  return (
    <InteractiveDataSelector
      fileData={uploadedFile}
      onDataSelected={handleDataSelected}
    />
  )
}
```

## User Interface

### 1. Data Range Section (Collapsible)
- Shows current data range (e.g., "Showing rows 1 to 100")
- Dual-handle slider for adjusting start and end points
- Reset button to restore full range
- Minimize/Maximize toggle

### 2. Row Selection Section (Collapsible)
- Checkbox for each data row
- Shows first few columns as preview
- "Select All" / "Deselect All" buttons
- Row counter (e.g., "5 of 100 selected")
- Minimize/Maximize toggle

### 3. Column Selection Section (Collapsible)
- Checkbox for each column
- When column selected, shows value filter options
- Value filters allow selecting specific values to include
- Column counter
- Minimize/Maximize toggle

### 4. Generate Charts Button
- Enabled when at least one row and column are selected
- Triggers chart generation with filtered data
- Keeps interface visible for continued interaction

## Data Flow

1. **Initial Load**: Component receives `fileData` prop with raw spreadsheet data
2. **User Selection**: User selects rows, columns, and applies value filters
3. **Real-time Filtering**: `filteredData` computed using `useMemo` based on selections
4. **Chart Generation**: Clicking "Generate Charts" calls `onDataSelected` with filtered data
5. **Persistent Interface**: Interface remains visible for real-time adjustments

## Performance Optimizations

- **Memoized Filtering**: Uses `useMemo` to prevent unnecessary re-computations
- **Set Data Structures**: Uses JavaScript Sets for efficient selection tracking
- **Lazy Initialization**: Column filters initialized only when columns are selected

## Key Implementation Details

### Column Filter Structure
```typescript
interface ColumnFilter {
  column: string
  selectedValues: Set<string>
  allValues: string[]
}
```

### Filtered Data Computation
```typescript
const filteredData = useMemo(() => {
  // Apply range filter
  const rangedData = allData.slice(startIndex, endIndex + 1)

  // Apply row selection
  const rowFilteredData = selectedRows.size > 0
    ? rangedData.filter((_, index) => selectedRows.has(index))
    : rangedData

  // Apply column value filters
  return rowFilteredData.filter(row => {
    for (const [column, filter] of columnFilters.entries()) {
      const value = row[columnHeaders.indexOf(column)]
      if (!filter.selectedValues.has(String(value))) {
        return false
      }
    }
    return true
  })
}, [allData, selectedRows, columnFilters, startIndex, endIndex])
```

## Styling

The component uses Tailwind CSS classes for styling:
- Green gradient header for the "NEW VERSION" banner
- Gray borders and hover effects for interactive elements
- Smooth transitions for collapsible sections
- Responsive grid layout for checkboxes

## Accessibility Features

- Keyboard navigation support
- ARIA labels for screen readers
- Focus indicators on interactive elements
- Clear visual feedback for selected states

## Browser Compatibility

- Modern browsers (Chrome, Firefox, Safari, Edge)
- Requires JavaScript enabled
- Responsive design for different screen sizes

## Future Enhancements

Potential improvements for future versions:
- Search/filter for row and column lists
- Export selected data to CSV
- Save/load selection presets
- Bulk selection patterns (e.g., every nth row)
- Column type detection and specialized filters
- Undo/redo for selections