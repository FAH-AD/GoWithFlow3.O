@echo off
echo.
echo ===================================================
echo   GoWithFlow Review Database Index Fix
echo ===================================================
echo.
echo This script will:
echo  1. Drop problematic legacy indexes
echo  2. Clean up invalid review documents  
echo  3. Create proper unique indexes
echo.
echo Make sure MongoDB is running before proceeding!
echo.
pause
echo.
echo Running fix script...
node scripts/fix-review-indexes.js
echo.
pause
