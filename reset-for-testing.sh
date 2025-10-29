#!/bin/bash

# SalesBox.AI - Reset Script for Testing First-Launch Experience
# This script clears all app data to simulate a fresh installation

echo "🔄 SalesBoxAI - Reset for Testing"
echo "=================================="
echo ""

# Determine which version to reset
echo "Which version do you want to reset?"
echo "  1) Development (salesbox.ai.agent.dev)"
echo "  2) Production (salesbox.ai.agent)"
echo "  3) Both"
read -p "Enter choice [1-3]: " -n 1 -r
echo ""
echo ""

case $REPLY in
    1)
        APP_NAME="salesbox.ai.agent.dev"
        ;;
    2)
        APP_NAME="salesbox.ai.agent"
        ;;
    3)
        APP_NAME="both"
        ;;
    *)
        echo "Invalid choice. Exiting."
        exit 1
        ;;
esac

if [ "$APP_NAME" = "both" ]; then
    APPS=("salesbox.ai.agent.dev" "salesbox.ai.agent")
else
    APPS=("$APP_NAME")
fi

for APP in "${APPS[@]}"; do
    echo "📦 Processing: $APP"
    DATA_DIR="$HOME/Library/Application Support/$APP/data"
    CONFIG_FILE="$HOME/Library/Application Support/$APP/settings.json"

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
