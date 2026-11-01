import { Asset } from '../store/useStore'

/**
 * Calculates the current book value of an asset using the Straight-Line Depreciation method.
 * Formula: Book Value = Purchase Price - ((Purchase Price - Salvage Value) / Useful Life) * Years Elapsed
 */
export const calculateBookValue = (asset: Asset): number => {
  const purchasePrice = asset.unitCost || 0
  const salvageValue = asset.salvageValue || 0
  const usefulLife = asset.usefulLife || 5
  
  if (!asset.purchaseDate) return purchasePrice * (asset.quantity || 1)

  const purchaseDate = new Date(asset.purchaseDate)
  const today = new Date()
  
  // Calculate years elapsed (including partial years)
  const diffTime = Math.max(0, today.getTime() - purchaseDate.getTime())
  const yearsElapsed = diffTime / (1000 * 60 * 60 * 24 * 365.25)
  
  const annualDepreciation = (purchasePrice - salvageValue) / usefulLife
  const totalDepreciation = Math.min(purchasePrice - salvageValue, annualDepreciation * yearsElapsed)
  
  const currentUnitBookValue = Math.max(salvageValue, purchasePrice - totalDepreciation)
  
  return currentUnitBookValue * (asset.quantity || 1)
}

export const calculateAccumulatedDepreciation = (asset: Asset): number => {
  const originalCost = (asset.unitCost || 0) * (asset.quantity || 1)
  const bookVal = calculateBookValue(asset)
  return Math.max(0, originalCost - bookVal)
}

export const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'ETB',
    currencyDisplay: 'symbol',
    minimumFractionDigits: 2
  }).format(amount).replace('ETB', 'ETB ')
}
