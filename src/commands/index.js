// Export all command modules
import balance from './balance.js';
import followers from './followers.js';
import generate from './generate.js';
import help from './help.js';
import limits from './limits.js';
import panel from './panel.js';
import prices from './prices.js';
import settings from './settings.js';
import status from './status.js';
import stock from './stock.js';

// Build a Map for quick lookup (commands + aliases)
export const commands = new Map();

function register(command) {
  commands.set(command.name, command);
  if (command.aliases) {
    for (const alias of command.aliases) {
      commands.set(alias, command);
    }
  }
}

register(balance);
register(followers);
register(generate);
register(help);
register(limits);
register(panel);
register(prices);
register(settings);
register(status);
register(stock);
