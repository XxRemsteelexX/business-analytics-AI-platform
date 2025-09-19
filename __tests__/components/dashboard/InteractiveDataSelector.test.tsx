import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom'
import { InteractiveDataSelector } from '@/components/dashboard/InteractiveDataSelector'

// Mock the UI components
jest.mock('@/components/ui/button', () => ({
  Button: ({ children, onClick, ...props }: any) => (
    <button onClick={onClick} {...props}>{children}</button>
  )
}))

jest.mock('@/components/ui/checkbox', () => ({
  Checkbox: ({ checked, onCheckedChange, ...props }: any) => (
    <input
      type="checkbox"
      checked={checked}
      onChange={(e) => onCheckedChange(e.target.checked)}
      {...props}
    />
  )
}))

jest.mock('@/components/ui/slider', () => ({
  Slider: ({ value, onValueChange, max, ...props }: any) => (
    <input
      type="range"
      value={value?.[0] || 0}
      onChange={(e) => onValueChange([parseInt(e.target.value), value?.[1] || max])}
      max={max}
      {...props}
    />
  )
}))

describe('InteractiveDataSelector', () => {
  const mockFileData = {
    fileName: 'test.csv',
    sheets: [{
      name: 'Sheet1',
      data: [
        ['Name', 'Age', 'City', 'Status'],
        ['John', '25', 'NYC', 'Active'],
        ['Jane', '30', 'LA', 'Active'],
        ['Bob', '35', 'Chicago', 'Inactive'],
        ['Alice', '28', 'Boston', 'Active']
      ]
    }]
  }

  const mockOnDataSelected = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Component Rendering', () => {
    it('should render all three collapsible sections', () => {
      render(
        <InteractiveDataSelector
          fileData={mockFileData}
          onDataSelected={mockOnDataSelected}
        />
      )

      expect(screen.getByText(/Data Range/)).toBeInTheDocument()
      expect(screen.getByText(/Select Rows/)).toBeInTheDocument()
      expect(screen.getByText(/Select Columns & Filter Values/)).toBeInTheDocument()
    })

    it('should display the file name', () => {
      render(
        <InteractiveDataSelector
          fileData={mockFileData}
          onDataSelected={mockOnDataSelected}
        />
      )

      expect(screen.getByText('test.csv')).toBeInTheDocument()
    })

    it('should render Generate Charts button', () => {
      render(
        <InteractiveDataSelector
          fileData={mockFileData}
          onDataSelected={mockOnDataSelected}
        />
      )

      expect(screen.getByText('Generate Charts')).toBeInTheDocument()
    })
  })

  describe('Collapsible Sections', () => {
    it('should toggle Data Range section when clicking expand/collapse', () => {
      render(
        <InteractiveDataSelector
          fileData={mockFileData}
          onDataSelected={mockOnDataSelected}
        />
      )

      const toggleButton = screen.getAllByRole('button')[0] // First toggle button

      // Should be expanded initially
      expect(screen.getByText(/Showing rows 1 to 4/)).toBeInTheDocument()

      // Collapse
      fireEvent.click(toggleButton)
      expect(screen.queryByText(/Showing rows 1 to 4/)).not.toBeInTheDocument()

      // Expand again
      fireEvent.click(toggleButton)
      expect(screen.getByText(/Showing rows 1 to 4/)).toBeInTheDocument()
    })

    it('should toggle Row Selection section', () => {
      render(
        <InteractiveDataSelector
          fileData={mockFileData}
          onDataSelected={mockOnDataSelected}
        />
      )

      const toggleButtons = screen.getAllByRole('button')
      const rowToggle = toggleButtons.find(btn =>
        btn.closest('div')?.textContent?.includes('Select Rows')
      )

      if (rowToggle) {
        // Initially expanded
        expect(screen.getByText('John')).toBeInTheDocument()

        // Collapse
        fireEvent.click(rowToggle)
        expect(screen.queryByText('John')).not.toBeInTheDocument()

        // Expand
        fireEvent.click(rowToggle)
        expect(screen.getByText('John')).toBeInTheDocument()
      }
    })

    it('should toggle Column Selection section', () => {
      render(
        <InteractiveDataSelector
          fileData={mockFileData}
          onDataSelected={mockOnDataSelected}
        />
      )

      const toggleButtons = screen.getAllByRole('button')
      const columnToggle = toggleButtons.find(btn =>
        btn.closest('div')?.textContent?.includes('Select Columns')
      )

      if (columnToggle) {
        // Initially expanded
        expect(screen.getByText('Name')).toBeInTheDocument()

        // Collapse
        fireEvent.click(columnToggle)

        // The column name might still be in the header, check for specific column content
        const columnContent = screen.queryAllByText('Name').filter(el =>
          el.closest('.border-gray-100')
        )
        expect(columnContent).toHaveLength(0)
      }
    })
  })

  describe('Row Selection', () => {
    it('should select/deselect rows with checkboxes', () => {
      render(
        <InteractiveDataSelector
          fileData={mockFileData}
          onDataSelected={mockOnDataSelected}
        />
      )

      const checkboxes = screen.getAllByRole('checkbox')
      const rowCheckboxes = checkboxes.slice(0, 4) // First 4 are row checkboxes

      // Select first row
      fireEvent.click(rowCheckboxes[0])
      expect(rowCheckboxes[0]).toBeChecked()

      // Deselect first row
      fireEvent.click(rowCheckboxes[0])
      expect(rowCheckboxes[0]).not.toBeChecked()
    })

    it('should select/deselect all rows with Select All', () => {
      render(
        <InteractiveDataSelector
          fileData={mockFileData}
          onDataSelected={mockOnDataSelected}
        />
      )

      const selectAllButton = screen.getByText('Select All')
      const checkboxes = screen.getAllByRole('checkbox')
      const rowCheckboxes = checkboxes.slice(0, 4)

      // Select all
      fireEvent.click(selectAllButton)
      rowCheckboxes.forEach(cb => expect(cb).toBeChecked())

      // Click again should deselect all
      const deselectAllButton = screen.getByText('Deselect All')
      fireEvent.click(deselectAllButton)
      rowCheckboxes.forEach(cb => expect(cb).not.toBeChecked())
    })
  })

  describe('Column Selection and Value Filtering', () => {
    it('should select/deselect columns', () => {
      render(
        <InteractiveDataSelector
          fileData={mockFileData}
          onDataSelected={mockOnDataSelected}
        />
      )

      // Find column checkboxes (they come after row checkboxes)
      const checkboxes = screen.getAllByRole('checkbox')
      const columnCheckboxes = checkboxes.slice(4) // Skip row checkboxes

      // Select first column
      fireEvent.click(columnCheckboxes[0])
      expect(columnCheckboxes[0]).toBeChecked()

      // Deselect
      fireEvent.click(columnCheckboxes[0])
      expect(columnCheckboxes[0]).not.toBeChecked()
    })

    it('should show value filters when column is selected', () => {
      render(
        <InteractiveDataSelector
          fileData={mockFileData}
          onDataSelected={mockOnDataSelected}
        />
      )

      // Select Name column
      const checkboxes = screen.getAllByRole('checkbox')
      const nameColumnCheckbox = checkboxes[4] // First column checkbox

      fireEvent.click(nameColumnCheckbox)

      // Should show value filters for Name column
      expect(screen.getByText('Filter Name values:')).toBeInTheDocument()
      expect(screen.getByText('John')).toBeInTheDocument()
      expect(screen.getByText('Jane')).toBeInTheDocument()
    })

    it('should filter column values', () => {
      render(
        <InteractiveDataSelector
          fileData={mockFileData}
          onDataSelected={mockOnDataSelected}
        />
      )

      // Select Name column
      const checkboxes = screen.getAllByRole('checkbox')
      const nameColumnCheckbox = checkboxes[4]
      fireEvent.click(nameColumnCheckbox)

      // Find value filter checkboxes
      const allCheckboxes = screen.getAllByRole('checkbox')
      const valueCheckboxes = allCheckboxes.slice(8) // After row and column checkboxes

      // Deselect "John" value
      fireEvent.click(valueCheckboxes[0])
      expect(valueCheckboxes[0]).not.toBeChecked()
    })
  })

  describe('Data Range Slider', () => {
    it('should update data range when slider changes', () => {
      render(
        <InteractiveDataSelector
          fileData={mockFileData}
          onDataSelected={mockOnDataSelected}
        />
      )

      const slider = screen.getByRole('slider')

      // Change slider value
      fireEvent.change(slider, { target: { value: '2' } })

      // Check if range text updated
      waitFor(() => {
        expect(screen.getByText(/Showing rows 1 to 2/)).toBeInTheDocument()
      })
    })

    it('should reset data range when clicking reset', () => {
      render(
        <InteractiveDataSelector
          fileData={mockFileData}
          onDataSelected={mockOnDataSelected}
        />
      )

      const slider = screen.getByRole('slider')

      // Change slider value
      fireEvent.change(slider, { target: { value: '2' } })

      // Click reset
      const resetButton = screen.getByText('Reset')
      fireEvent.click(resetButton)

      // Should be back to full range
      expect(screen.getByText(/Showing rows 1 to 4/)).toBeInTheDocument()
    })
  })

  describe('Generate Charts', () => {
    it('should call onDataSelected when Generate Charts is clicked', () => {
      render(
        <InteractiveDataSelector
          fileData={mockFileData}
          onDataSelected={mockOnDataSelected}
        />
      )

      // Select some rows and columns
      const checkboxes = screen.getAllByRole('checkbox')
      fireEvent.click(checkboxes[0]) // Select first row
      fireEvent.click(checkboxes[4]) // Select first column

      // Click Generate Charts
      const generateButton = screen.getByText('Generate Charts')
      fireEvent.click(generateButton)

      // Should call the callback
      expect(mockOnDataSelected).toHaveBeenCalled()
    })

    it('should disable Generate Charts when no data selected', () => {
      render(
        <InteractiveDataSelector
          fileData={mockFileData}
          onDataSelected={mockOnDataSelected}
        />
      )

      const generateButton = screen.getByText('Generate Charts')

      // Should be disabled initially (no selections)
      expect(generateButton).toBeDisabled()
    })

    it('should enable Generate Charts when data is selected', () => {
      render(
        <InteractiveDataSelector
          fileData={mockFileData}
          onDataSelected={mockOnDataSelected}
        />
      )

      // Select a row and column
      const checkboxes = screen.getAllByRole('checkbox')
      fireEvent.click(checkboxes[0]) // Select first row
      fireEvent.click(checkboxes[4]) // Select first column

      const generateButton = screen.getByText('Generate Charts')
      expect(generateButton).not.toBeDisabled()
    })
  })

  describe('Data Filtering Integration', () => {
    it('should filter data based on all selections', () => {
      render(
        <InteractiveDataSelector
          fileData={mockFileData}
          onDataSelected={mockOnDataSelected}
        />
      )

      // Select specific rows
      const checkboxes = screen.getAllByRole('checkbox')
      fireEvent.click(checkboxes[0]) // John row
      fireEvent.click(checkboxes[1]) // Jane row

      // Select Name and Age columns
      fireEvent.click(checkboxes[4]) // Name column
      fireEvent.click(checkboxes[5]) // Age column

      // Generate charts
      const generateButton = screen.getByText('Generate Charts')
      fireEvent.click(generateButton)

      // Check the data passed to callback
      expect(mockOnDataSelected).toHaveBeenCalledWith(
        expect.objectContaining({
          fileName: 'test.csv',
          sheetName: 'Sheet1'
        })
      )

      const callData = mockOnDataSelected.mock.calls[0][0]
      expect(callData.data).toHaveLength(2) // Only 2 rows selected
      expect(Object.keys(callData.data[0])).toEqual(['Name', 'Age']) // Only 2 columns
    })
  })
})