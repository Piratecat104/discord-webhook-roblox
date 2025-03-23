--[[
    Example usage of the Discord webhook
]]

local DiscordWebhook = require(script.Parent.DiscordWebhook)

-- Send a simple message
local function sendSimpleMessage()
    local success, response = DiscordWebhook:SendMessage("Hello from Roblox!")
    print("Message sent:", success, response)
end

-- Send a message with a custom username and avatar
local function sendCustomMessage()
    local options = {
        username = "Game Event",
        avatarUrl = "https://www.example.com/avatar.png"
    }
    
    DiscordWebhook:SendMessage("A player joined the game!", options)
end

-- Send an embed with rich formatting
local function sendEmbed()
    local embed = {
        title = "Player Statistics",
        description = "Here are the latest player statistics",
        color = 5814783, -- Light blue
        fields = {
            {
                name = "Online Players",
                value = "42",
                inline = true
            },
            {
                name = "Total Points",
                value = "1,337",
                inline = true
            }
        },
        footer = {
            text = "Updated just now"
        }
    }
    
    DiscordWebhook:SendEmbed(embed)
end

-- Examples of usage
sendSimpleMessage()
-- Wait a moment before sending the next message to avoid rate limiting
wait(2)
sendCustomMessage()
wait(2)
sendEmbed()