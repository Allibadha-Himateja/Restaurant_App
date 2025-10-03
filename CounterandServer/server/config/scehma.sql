-- Restaurant Counter Database Schema
-- Drop existing tables if they exist
IF OBJECT_ID('OrderItems', 'U') IS NOT NULL DROP TABLE OrderItems;
IF OBJECT_ID('KitchenQueue', 'U') IS NOT NULL DROP TABLE KitchenQueue;
IF OBJECT_ID('Bills', 'U') IS NOT NULL DROP TABLE Bills;
IF OBJECT_ID('Orders', 'U') IS NOT NULL DROP TABLE Orders;
IF OBJECT_ID('MenuItems', 'U') IS NOT NULL DROP TABLE MenuItems;
IF OBJECT_ID('Categories', 'U') IS NOT NULL DROP TABLE Categories;
IF OBJECT_ID('Tables', 'U') IS NOT NULL DROP TABLE Tables;
IF OBJECT_ID('SystemSettings', 'U') IS NOT NULL DROP TABLE SystemSettings;

-- Categories table
CREATE TABLE Categories (
    CategoryID INT IDENTITY(1,1) PRIMARY KEY,
    CategoryName NVARCHAR(100) NOT NULL UNIQUE,
    DisplayOrder INT DEFAULT 0,
    IsActive BIT DEFAULT 1,
    CreatedAt DATETIME2 DEFAULT GETDATE(),
    UpdatedAt DATETIME2 DEFAULT GETDATE()
);

-- Menu Items table
CREATE TABLE MenuItems (
    ItemID INT IDENTITY(1,1) PRIMARY KEY,
    CategoryID INT NOT NULL,
    ItemName NVARCHAR(200) NOT NULL,
    RegularPrice DECIMAL(10,2) NOT NULL,
    JainPrice DECIMAL(10,2) NULL,
    Description NVARCHAR(500) NULL,
    ImagePath NVARCHAR(300) NULL,
    PreparationTime INT DEFAULT 15, -- in minutes
    IsAvailable BIT DEFAULT 1,
    IsVegetarian BIT DEFAULT 1,
    IsJainAvailable BIT DEFAULT 0,
    DisplayOrder INT DEFAULT 0,
    CreatedAt DATETIME2 DEFAULT GETDATE(),
    UpdatedAt DATETIME2 DEFAULT GETDATE(),
    FOREIGN KEY (CategoryID) REFERENCES Categories(CategoryID)
);

-- Tables table
CREATE TABLE Tables (
    TableID INT IDENTITY(1,1) PRIMARY KEY,
    TableNumber INT NOT NULL UNIQUE,
    Capacity INT NOT NULL DEFAULT 4,
    Status NVARCHAR(20) DEFAULT 'Available', -- Available, Occupied, Reserved, OutOfService
    CurrentOrderID INT NULL,
    CreatedAt DATETIME2 DEFAULT GETDATE(),
    UpdatedAt DATETIME2 DEFAULT GETDATE()
);

-- Orders table
CREATE TABLE Orders (
    OrderID INT IDENTITY(1,1) PRIMARY KEY,
    OrderNumber NVARCHAR(20) NOT NULL UNIQUE,
    TableID INT NULL,
    OrderType NVARCHAR(20) NOT NULL DEFAULT 'DineIn', -- DineIn, Parcel
    CustomerName NVARCHAR(100) NULL,
    CustomerPhone NVARCHAR(15) NULL,
    Status NVARCHAR(20) DEFAULT 'Pending', -- Pending, InProgress, Ready, Completed, Cancelled
    TotalAmount DECIMAL(10,2) DEFAULT 0,
    TaxAmount DECIMAL(10,2) DEFAULT 0,
    DiscountAmount DECIMAL(10,2) DEFAULT 0,
    FinalAmount DECIMAL(10,2) DEFAULT 0,
    SpecialInstructions NVARCHAR(500) NULL,
    CreatedAt DATETIME2 DEFAULT GETDATE(),
    UpdatedAt DATETIME2 DEFAULT GETDATE(),
    FOREIGN KEY (TableID) REFERENCES Tables(TableID)
);

-- Order Items table
CREATE TABLE OrderItems (
    OrderItemID INT IDENTITY(1,1) PRIMARY KEY,
    OrderID INT NOT NULL,
    ItemID INT NOT NULL,
    ItemName NVARCHAR(200) NOT NULL,
    Quantity INT NOT NULL DEFAULT 1,
    UnitPrice DECIMAL(10,2) NOT NULL,
    TotalPrice DECIMAL(10,2) NOT NULL,
    IsJainVariant BIT DEFAULT 0,
    SpecialInstructions NVARCHAR(300) NULL,
    Status NVARCHAR(20) DEFAULT 'Ordered', -- Ordered, Preparing, Ready, Served
    CreatedAt DATETIME2 DEFAULT GETDATE(),
    FOREIGN KEY (OrderID) REFERENCES Orders(OrderID),
    FOREIGN KEY (ItemID) REFERENCES MenuItems(ItemID)
);

-- Kitchen Queue table
CREATE TABLE KitchenQueue (
    QueueID INT IDENTITY(1,1) PRIMARY KEY,
    OrderID INT NOT NULL,
    OrderItemID INT NOT NULL,
    ItemID INT NOT NULL,
    ItemName NVARCHAR(200) NOT NULL,
    Quantity INT NOT NULL,
    Priority INT DEFAULT 2, -- 1=Low, 2=Medium, 3=High
    Status NVARCHAR(20) DEFAULT 'Queued', -- Queued, InProgress, Completed
    AssignedTo NVARCHAR(100) NULL,
    EstimatedTime INT NULL, -- in minutes
    StartedAt DATETIME2 NULL,
    CompletedAt DATETIME2 NULL,
    SpecialInstructions NVARCHAR(300) NULL,
    CreatedAt DATETIME2 DEFAULT GETDATE(),
    FOREIGN KEY (OrderID) REFERENCES Orders(OrderID),
    FOREIGN KEY (OrderItemID) REFERENCES OrderItems(OrderItemID),
    FOREIGN KEY (ItemID) REFERENCES MenuItems(ItemID)
);

-- Bills table
CREATE TABLE Bills (
    BillID INT IDENTITY(1,1) PRIMARY KEY,
    OrderID INT NOT NULL,
    BillNumber NVARCHAR(20) NOT NULL UNIQUE,
    SubTotal DECIMAL(10,2) NOT NULL,
    TaxRate DECIMAL(5,2) DEFAULT 5.00, -- GST percentage
    TaxAmount DECIMAL(10,2) NOT NULL,
    DiscountAmount DECIMAL(10,2) DEFAULT 0,
    TotalAmount DECIMAL(10,2) NOT NULL,
    PaymentMethod NVARCHAR(20) NULL, -- Cash, Card, UPI, Online
    PaymentStatus NVARCHAR(20) DEFAULT 'Pending', -- Pending, Paid, Failed
    PaidAmount DECIMAL(10,2) DEFAULT 0,
    ChangeAmount DECIMAL(10,2) DEFAULT 0,
    PaymentReference NVARCHAR(100) NULL,
    CreatedAt DATETIME2 DEFAULT GETDATE(),
    PaidAt DATETIME2 NULL,
    FOREIGN KEY (OrderID) REFERENCES Orders(OrderID)
);

-- System Settings table
CREATE TABLE SystemSettings (
    SettingID INT IDENTITY(1,1) PRIMARY KEY,
    SettingKey NVARCHAR(100) NOT NULL UNIQUE,
    SettingValue NVARCHAR(500) NOT NULL,
    Description NVARCHAR(300) NULL,
    UpdatedAt DATETIME2 DEFAULT GETDATE()
);

-- Create indexes for better performance
CREATE INDEX IX_MenuItems_CategoryID ON MenuItems(CategoryID);
CREATE INDEX IX_MenuItems_IsAvailable ON MenuItems(IsAvailable);
CREATE INDEX IX_Orders_Status ON Orders(Status);
CREATE INDEX IX_Orders_CreatedAt ON Orders(CreatedAt);
CREATE INDEX IX_OrderItems_OrderID ON OrderItems(OrderID);
CREATE INDEX IX_KitchenQueue_Status ON KitchenQueue(Status);
CREATE INDEX IX_KitchenQueue_Priority ON KitchenQueue(Priority);
CREATE INDEX IX_Bills_OrderID ON Bills(OrderID);
CREATE INDEX IX_Bills_PaymentStatus ON Bills(PaymentStatus);

-- Insert default tables
INSERT INTO Tables (TableNumber, Capacity, Status) VALUES
(1, 4, 'Available'),
(2, 4, 'Available'),
(3, 6, 'Available'),
(4, 2, 'Available'),
(5, 4, 'Available'),
(6, 6, 'Available'),
(7, 4, 'Available'),
(8, 2, 'Available'),
(9, 4, 'Available'),
(10, 6, 'Available');

-- Insert system settings
INSERT INTO SystemSettings (SettingKey, SettingValue, Description) VALUES
('TAX_RATE', '5.00', 'GST Tax Rate Percentage'),
('RESTAURANT_NAME', 'Veg Treat Restaurant', 'Restaurant Name'),
('RESTAURANT_ADDRESS', 'Your Restaurant Address', 'Restaurant Address'),
('RESTAURANT_PHONE', '+91-XXXXXXXXXX', 'Restaurant Contact Number'),
('ORDER_PREFIX', 'VT', 'Order Number Prefix'),
('BILL_PREFIX', 'BILL', 'Bill Number Prefix'),
('DEFAULT_PREPARATION_TIME', '15', 'Default preparation time in minutes');

PRINT 'Database schema created successfully!';