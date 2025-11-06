#!/bin/bash

# SalesboxAI - Reset Script for Release Build
# This script clears all app data including localStorage (Tauri store)

echo "🔄 SalesBoxAI - Reset Release Build"
echo "===================================="
echo ""

APP_NAME="salesbox.ai.agent"  # Production/Release build identifier

echo "📦 Resetting: $APP_NAME (Release Build)"
echo ""

# Define paths
APP_SUPPORT_DIR="$HOME/Library/Application Support/$APP_NAME"
DATA_DIR="$APP_SUPPORT_DIR/data"
CONFIG_FILE="$APP_SUPPORT_DIR/settings.json"
STORE_FILE="$APP_SUPPORT_DIR/store.json"  # Tauri store (contains localStorage)

echo "📁 App data locations:"
echo "   Application Support: $APP_SUPPORT_DIR"
echo "   Data folder: $DATA_DIR"
echo "   Config file: $CONFIG_FILE"
echo "   Store file (localStorage): $STORE_FILE"
echo ""

# Function to delete if exists
delete_if_exists() {
    local path=$1
    local description=$2
    local type=$3  # 'file' or 'directory'

    if [ "$type" = "directory" ] && [ -d "$path" ]; then
        echo "   Found $description: $path"
        read -p "   Delete? (y/N): " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            rm -rf "$path"
            echo "   ✅ Deleted $description"
        else
            echo "   ⏭️  Skipped deleting $description"
        fi
    elif [ "$type" = "file" ] && [ -f "$path" ]; then
        echo "   Found $description: $path"
        read -p "   Delete? (y/N): " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            rm -f "$path"
            echo "   ✅ Deleted $description"
        else
            echo "   ⏭️  Skipped deleting $description"
        fi
    else
        echo "   ℹ️  No $description found"
    fi
    echo ""
}

# Delete data folder (models, downloads, etc.)
delete_if_exists "$DATA_DIR" "data folder" "directory"

# Delete config file
delete_if_exists "$CONFIG_FILE" "config file" "file"

# Delete Tauri store (contains localStorage, Zustand persisted state, etc.)
delete_if_exists "$STORE_FILE" "store file (localStorage + persisted state)" "file"

echo "===================================="
echo ""
echo "🎯 Quick Reset (Delete Everything)"
echo "   To quickly delete all app data without prompts:"
echo "   rm -rf '$APP_SUPPORT_DIR'"
echo ""
echo "✨ After resetting:"
echo "   1. All settings cleared"
echo "   2. All localStorage cleared"
echo "   3. All persisted state cleared"
echo "   4. Restart the app for fresh start"
echo ""
