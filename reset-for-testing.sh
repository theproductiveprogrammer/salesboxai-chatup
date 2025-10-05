#!/bin/bash

# SalesBox.AI - Reset Script for Testing First-Launch Experience
# This script clears all app data to simulate a fresh installation

echo "🔄 SalesBoxAI - Reset for Testing"
echo "=================================="
echo ""

# Determine the app name based on Cargo.toml
APP_NAME="SalesboxAIAgent"
DATA_DIR="$HOME/Library/Application Support/$APP_NAME/data"
CONFIG_FILE="$HOME/Library/Application Support/$APP_NAME/settings.json"

echo "📁 Checking for app data..."
echo ""

# Check if data folder exists
if [ -d "$DATA_DIR" ]; then
    echo "   Found data folder: $DATA_DIR"
    read -p "   Delete downloaded models and all data? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        rm -rf "$DATA_DIR"
        echo "   ✅ Deleted data folder"
    else
        echo "   ⏭️  Skipped deleting data folder"
    fi
else
    echo "   ℹ️  No data folder found (never run before)"
fi

echo ""

# Check if config file exists
if [ -f "$CONFIG_FILE" ]; then
    echo "   Found config file: $CONFIG_FILE"
    read -p "   Delete config file? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        rm -f "$CONFIG_FILE"
        echo "   ✅ Deleted config file"
    else
        echo "   ⏭️  Skipped deleting config file"
    fi
else
    echo "   ℹ️  No config file found"
fi

echo ""
echo "🌐 Browser Data (localStorage, sessionStorage)"
echo "   ⚠️  You need to manually clear browser data:"
echo ""
echo "   1. Open the app"
echo "   2. Open Developer Tools (Cmd+Option+I)"
echo "   3. Go to Console tab"
echo "   4. Run these commands:"
echo ""
echo "      localStorage.clear()"
echo "      sessionStorage.clear()"
echo "      location.reload()"
echo ""
echo "=================================="
echo ""
echo "✨ To test first-launch:"
echo "   1. Run this script and choose 'y' for all prompts"
echo "   2. Clear browser storage (see instructions above)"
echo "   3. Restart the app"
echo "   4. It should auto-download Jan-Nano!"
echo ""
