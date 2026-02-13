/**
 * EVOLUTION API - PATCH DE BOTÕES
 * Baseado em estratégias de projetos que funcionam (ndalu-id, Z-API)
 */

import { proto } from '@whiskeysockets/baileys';
import { SendButtonsDto, SendListDto } from '@api/dto/sendMessage.dto';

/**
 * ESTRATÉGIA 1: Botões Simples (Reply Buttons)
 * Estrutura antiga que ainda funciona em alguns casos
 */
export async function buttonMessageSimple(this: any, data: SendButtonsDto) {
  try {
    if (data.buttons.length === 0 || data.buttons.length > 3) {
      throw new Error('1 to 3 buttons required');
    }

    const buttons = data.buttons.map((btn, index) => ({
      buttonId: btn.id || `btn_${index}`,
      buttonText: { displayText: btn.displayText },
      type: 1, // RESPONSE type
    }));

    const baseMessage: any = {
      text: data.title + (data.description ? '\n\n' + data.description : ''),
      footer: data?.footer || '',
      buttons: buttons,
      headerType: 1,
      viewOnce: true, // Flag crítica!
    };

    // Adicionar imagem se fornecida
    if (data.thumbnailUrl) {
      const mediaMessage = await this.prepareMediaMessage({ 
        mediatype: 'image', 
        media: data.thumbnailUrl 
      });

      if (mediaMessage?.message?.imageMessage) {
        baseMessage.image = mediaMessage.message.imageMessage;
        baseMessage.caption = baseMessage.text;
        delete baseMessage.text;
      }
    }

    return await this.sendMessageWithTyping(data.number, baseMessage, {
      delay: data?.delay,
      presence: 'composing',
      quoted: data?.quoted,
      mentionsEveryOne: data?.mentionsEveryOne,
      mentioned: data?.mentioned,
    });

  } catch (error) {
    this.logger.error('buttonMessageSimple error:', error);
    throw error;
  }
}

/**
 * ESTRATÉGIA 2: Template Message (Botões Avançados)
 * Para URL e Call buttons
 */
export async function buttonMessageTemplate(this: any, data: SendButtonsDto) {
  try {
    const hydratedButtons: any[] = [];
    
    data.buttons.forEach((btn, index) => {
      const buttonIndex = index + 1;

      if (btn.type === 'url') {
        hydratedButtons.push({
          index: buttonIndex,
          urlButton: {
            displayText: btn.displayText,
            url: btn.url,
          },
        });
      } else if (btn.type === 'call') {
        hydratedButtons.push({
          index: buttonIndex,
          callButton: {
            displayText: btn.displayText,
            phoneNumber: btn.phoneNumber,
          },
        });
      } else {
        hydratedButtons.push({
          index: buttonIndex,
          quickReplyButton: {
            displayText: btn.displayText,
            id: btn.id || `reply_${index}`,
          },
        });
      }
    });

    const templateMessage: proto.ITemplateMessage = {
      hydratedTemplate: {
        hydratedContentText: data.title + (data.description ? '\n\n' + data.description : ''),
        hydratedFooterText: data?.footer || '',
        hydratedButtons: hydratedButtons,
      },
    };

    if (data.thumbnailUrl) {
      const mediaMessage = await this.prepareMediaMessage({ 
        mediatype: 'image', 
        media: data.thumbnailUrl 
      });

      if (mediaMessage?.message?.imageMessage) {
        templateMessage.hydratedTemplate.imageMessage = mediaMessage.message.imageMessage;
      }
    }

    return await this.sendMessageWithTyping(
      data.number, 
      { templateMessage },
      {
        delay: data?.delay,
        presence: 'composing',
        quoted: data?.quoted,
        mentionsEveryOne: data?.mentionsEveryOne,
        mentioned: data?.mentioned,
      }
    );

  } catch (error) {
    this.logger.error('buttonMessageTemplate error:', error);
    throw error;
  }
}

/**
 * AUTO-SELECT: Escolhe melhor estratégia
 */
export async function buttonMessageAuto(this: any, data: SendButtonsDto) {
  const hasReplyButtons = data.buttons.some((btn) => btn.type === 'reply');
  const hasUrlButtons = data.buttons.some((btn) => btn.type === 'url');
  const hasCallButtons = data.buttons.some((btn) => btn.type === 'call');

  // Apenas reply buttons e max 3 - usar simple
  if (hasReplyButtons && !hasUrlButtons && !hasCallButtons && data.buttons.length <= 3) {
    this.logger.verbose('🔧 Using SIMPLE button strategy');
    try {
      return await buttonMessageSimple.call(this, data);
    } catch (error) {
      this.logger.warn('Simple failed, trying template');
      return await buttonMessageTemplate.call(this, data);
    }
  }

  // URL ou Call buttons - usar template
  if (hasUrlButtons || hasCallButtons) {
    this.logger.verbose('🔧 Using TEMPLATE button strategy');
    return await buttonMessageTemplate.call(this, data);
  }

  // Fallback
  this.logger.verbose('Using default strategy');
  throw new Error('Use original method');
}

/**
 * List Message Otimizada
 */
export async function listMessageFixed(this: any, data: SendListDto) {
  try {
    if (!data.sections || data.sections.length === 0) {
      throw new Error('At least one section required');
    }

    const sections = data.sections.map((section, sectionIndex) => ({
      title: section.title,
      rows: section.rows.map((row, rowIndex) => ({
        title: row.title,
        description: row.description,
        rowId: row.rowId || `row_${sectionIndex}_${rowIndex}`,
      })),
    }));

    const listMessage: proto.IListMessage = {
      title: data.title,
      description: data.description,
      buttonText: data?.buttonText || 'Ver opções',
      footerText: data?.footerText,
      listType: proto.ListMessage.ListType.SINGLE_SELECT,
      sections: sections,
    };

    return await this.sendMessageWithTyping(
      data.number,
      { listMessage },
      {
        delay: data?.delay,
        presence: 'composing',
        quoted: data?.quoted,
        mentionsEveryOne: data?.mentionsEveryOne,
        mentioned: data?.mentioned,
      },
    );

  } catch (error) {
    this.logger.error('listMessageFixed error:', error);
    throw error;
  }
}

export const patchedMethods = {
  buttonMessage: buttonMessageAuto,
  buttonMessageSimple: buttonMessageSimple,
  buttonMessageTemplate: buttonMessageTemplate,
  listMessage: listMessageFixed,
};
