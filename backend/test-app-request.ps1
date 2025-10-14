# Test App Request Format
$headers = @{
    'Content-Type' = 'application/json'
    'Authorization' = 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJhNGJhOTg4Ni1jZTMwLTQzZWEtOWFjMC03Y2E0NWU0NTU3MGYiLCJ1c2VySWQiOiJhNGJhOTg4Ni1jZTMwLTQzZWEtOWFjMC03Y2E0NWU0NTU3MGYiLCJlbWFpbCI6ImF5b0Bjb2RlbXlnaWcuY29tIiwicGhvbmVOdW1iZXIiOiIrMjM0ODE0MjM2NDQ3NCIsInNlc3Npb25JZCI6IjBhZGU0MmZiLWU3NzAtNGZkYS1hOGRkLTQ5YjdlMzc2NWQwNyIsInR5cGUiOiJhY2Nlc3MiLCJpYXQiOjE3NjAzODA5OTUsImV4cCI6MTc2MDQ2NzM5NX0.oE4O62WkJUlnBXkefWy3PxA1WAwM60HqCRjCs9CWE8w'
}

$body = @{
    listingType = "item"
    categoryId = 5
    title = "Laptop G5 Mid - App Test"
    description = "Uk used laptop. SSD . HDD . 34 Ram , corei9, "
    price = 50000
    priceType = "fixed"
    location = @{
        latitude = 0
        longitude = 0
        address = "Ikeja, Lagos"
    }
    media = @(
        @{
            id = "media-0"
            url = "https://6unny.nyc3.cdn.digitaloceanspaces.com/media/a4ba9886-ce30-43ea-9ac0-7ca45e45570f/9a3be6eb-d3c0-42b8-ada0-37a46a5951a2.jpg"
            type = "image"
            displayOrder = 0
        }
    )
    condition = "fair"
    brand = "Samsung"
    model = "J5"
    year = 2020
    warranty = "2 month"
} | ConvertTo-Json -Depth 3

Write-Host "🔍 Testing App Request Format:"
Write-Host "URL: http://localhost:3000/listings"
Write-Host "Method: POST"
Write-Host "Headers:"
$headers | ConvertTo-Json
Write-Host "Body:"
$body
Write-Host "`n🚀 Sending Request..."

try {
    $result = Invoke-RestMethod -Uri "http://localhost:3000/listings" -Method POST -Headers $headers -Body $body
    Write-Host "`n✅ SUCCESS! App request format is working correctly:"
    Write-Host "Response Status: 201 Created"
    Write-Host "Listing ID: $($result.id)"
    Write-Host "Title: $($result.title)"
    Write-Host "Price: NGN $($result.price)"
    Write-Host "Model: $($result.model)"
    Write-Host "Year: $($result.year)"
    Write-Host "Warranty: $($result.warranty)"
    Write-Host "Brand: $($result.brand)"
    Write-Host "Condition: $($result.condition)"
    Write-Host "Status: $($result.status)"
    Write-Host "Created: $($result.createdAt)"
} catch {
    Write-Host "`n❌ ERROR! App request format has issues:"
    Write-Host "Error: $($_.Exception.Message)"
    if ($_.Exception.Response) {
        $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
        $responseBody = $reader.ReadToEnd()
        Write-Host "Response Body: $responseBody"
    }
}
