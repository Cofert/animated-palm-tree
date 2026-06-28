// Shared account-generation logic used by the command and the panel/button.
import { generate, getDailyLimit, getBalance, getPrices } from '../bloxgen.js';
import { checkVoiceChat } from '../roblox.js';
import { buildAccountEmbed, generateAgainRow } from './ui.js';
import { logGeneration } from './logger.js';

// Single account (used by panel/button)
export async function generateAccount(client, { type, user, guildId }) {
  const acc = await generate(type);
  const voice = await checkVoiceChat(acc.cookie);
  await logGeneration(client, { user, type, acc, guildId });
  return { embeds: [buildAccountEmbed(acc, voice)], components: [generateAgainRow(type)] };
}

// Multiple accounts – returns an array of payloads (one per account)
export async function generateAccounts(client, { type, count, user, guildId, channel }) {
  const [limitData, balanceData, pricesData] = await Promise.all([
    getDailyLimit(),
    getBalance(),
    getPrices(),
  ]);

  const remainingLimit = limitData.remainingGenerations || 0;
  const price = pricesData[type] || 0;
  const balance = balanceData.balance || 0;

  let maxByLimit = Math.min(count, remainingLimit);
  let maxByBalance = balance >= price ? Math.floor(balance / price) : 0;
  let canGenerate = Math.min(maxByLimit, maxByBalance);

  if (canGenerate === 0) {
    let reason = '';
    if (remainingLimit === 0) reason = 'daily limit reached.';
    else if (balance < price) reason = `insufficient balance (need $${price} per account).`;
    else reason = 'unknown reason.';
    throw new Error(`Cannot generate any accounts: ${reason}`);
  }

  if (canGenerate < count) {
    await channel?.send(
      `⚠️ Only generating **${canGenerate}** out of **${count}** requested. ` +
      `(Remaining daily: ${remainingLimit}, balance: $${balance})`
    );
  }

  const payloads = [];
  const errors = [];
  for (let i = 0; i < canGenerate; i++) {
    try {
      const acc = await generate(type);
      const voice = await checkVoiceChat(acc.cookie);
      const embed = buildAccountEmbed(acc, voice);
      const payload = { embeds: [embed], components: [generateAgainRow(type)] };
      payloads.push(payload);
      await logGeneration(client, { user, type, acc, guildId });
      if (i < canGenerate - 1) await new Promise((resolve) => setTimeout(resolve, 500));
    } catch (err) {
      errors.push(`Account ${i + 1}: ${err.message}`);
    }
  }

  const summary = `✅ Generated **${payloads.length}** ${type} account${payloads.length > 1 ? 's' : ''}.`;
  return { count: payloads.length, payloads, summary, errors };
}
