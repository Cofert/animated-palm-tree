import { PREFIX } from '../config.js';
import { ACCOUNT_TYPES } from '../bloxgen.js';
import { buildPanel } from '../lib/ui.js';
import { generateAccounts } from '../lib/generation.js';
import { getDelivery } from '../lib/settings.js';

export default {
  name: 'generate',
  aliases: ['gen'],
  async execute({ message, args, client }) {
    const type = args[0]?.trim();
    const countArg = args[1]?.trim();

    if (!type) return buildPanel();

    if (!ACCOUNT_TYPES.includes(type)) {
      return `❌ Invalid type. Available: ${ACCOUNT_TYPES.map((t) => `\`${t}\``).join(', ')}`;
    }

    let count = 1;
    if (countArg) {
      const parsed = Number(countArg);
      if (Number.isInteger(parsed) && parsed > 0) {
        count = parsed;
      } else {
        return `❌ Count must be a positive integer. Example: \`${PREFIX}generate ${type} 5\``;
      }
    }

    const result = await generateAccounts(client, {
      type,
      count,
      user: message.author,
      guildId: message.guildId,
      channel: message.channel,
    });

    const mode = getDelivery(message.guildId);
    const sendPayload = async (payload) => {
      if (mode === 'server' && message.guild) {
        await message.channel.send(payload);
      } else {
        try {
          await message.author.send(payload);
        } catch {
          if (message.guild) {
            await message.channel.send(payload);
          } else {
            throw new Error('Could not DM you and no guild to fallback to.');
          }
        }
      }
    };

    // Send summary first
    await sendPayload({ content: result.summary });

    // Send each account embed
    for (const payload of result.payloads) {
      await sendPayload(payload);
      await new Promise((resolve) => setTimeout(resolve, 300)); // rate‑limit safe
    }

    if (result.errors.length) {
      await sendPayload({ content: `⚠️ Partial errors:\n${result.errors.join('\n')}` });
    }

    return null;
  },
};
