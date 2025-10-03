IF OBJECT_ID('DF_Orders_CreatedAt', 'D') IS NOT NULL
BEGIN
    ALTER TABLE Orders DROP CONSTRAINT DF_Orders_CreatedAt;
END
GO

ALTER TABLE Orders
DROP CONSTRAINT DF__Orders__CreatedA__208CD6FA;
GO

-- Step 2: Drop the OLD default constraint for UpdatedAt using its exact name from the error.
ALTER TABLE Orders
DROP CONSTRAINT DF__Orders__UpdatedA__2180FB33;
GO

-- Step 3: Now that the old rules are gone, alter the CreatedAt column.
ALTER TABLE Orders
ALTER COLUMN CreatedAt DATETIMEOFFSET NOT NULL;
GO

-- Step 4: Add the NEW, correct default rule for CreatedAt.
ALTER TABLE Orders
ADD CONSTRAINT DF_Orders_CreatedAt
DEFAULT SYSDATETIMEOFFSET() FOR CreatedAt;
GO

-- Step 5: Finally, alter the UpdatedAt column.
ALTER TABLE Orders
ALTER COLUMN UpdatedAt DATETIMEOFFSET NULL;
GO

DBCC CHECKIDENT ('Orders');