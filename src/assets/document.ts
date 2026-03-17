import type { Descendant } from 'slate'

export const document: Descendant[] = [
  {
    type: 'core/text',
    id: '538345e5-bacc-48f9-8ef1-a219891b6011',
    class: 'text',
    properties: {
      role: 'heading-1'
    },
    children: [
      { text: 'Kalmar Sweden' }
    ]
  },
  {
    type: 'core/text',
    id: '538345e5-bacc-48f9-8ef0-1219891b6034',
    class: 'text',
    properties: {
      role: 'heading-1'
    },
    children: [
      { text: '' }
    ]
  },
  {
    type: 'core/text',
    id: '538345e5-bacc-48f9-8ef0-1219891b6024',
    class: 'text',
    children: [
      { text: 'An example paragraph about ööland that contains text that is a wee bit ' },
      {
        text: 'stronger',
        'core/bold': true
      },
      {
        text: ' than normal but also text that is somewhat '
      },
      {
        text: 'emphasized',
        'core/italic': true
      },
      { text: ' compared to the normal styled text found elsewhere in the document.' }
    ]
  },
  {
    type: 'test/block',
    id: 'testblock-0001-0000-0000-000000000001',
    class: 'block',
    children: [
      {
        id: 'testblock-0001-0000-0000-000000000002',
        type: 'core/text',
        class: 'text',
        children: [{ text: 'This is a test block. Navigate here with arrow keys from the text above or below.' }]
      }
    ]
  },
  {
    type: 'core/codeblock',
    id: '538345e5-aad1-58f9-8ef0-b2198a1a60a2',
    class: 'block',
    children: [
      {
        id: '538345e5-aad1-58f9-8ef0-b2198a1a20aa',
        type: 'core/codeblock/title',
        class: 'text',
        children: [{ text: 'Title' }]
      },
      {
        id: '538345e5-aad1-58f9-8ef0-b2198a1a10ab',
        type: 'core/codeblock/body',
        class: 'text',
        children: [{ text: 'Body' }]
      }
    ]
  },
  {
    type: 'core/text',
    id: '538343b5-badd-48f9-8ef0-1219891b6061',
    class: 'text',
    properties: {
      lang: 'sv-se'
    },
    children: [
      { text: 'Här följer text som är på svenska och följaktligen bör stavningskollas på svenska. ' },
      {
        text: 'Stavningskontrollen fungerar '
      },
      {
        text: 'korrrekt',
        'core/italic': true
      },
      { text: ' på flera språk.' }
    ]
  },
  {
    type: 'core/text',
    id: '538343b5-badd-48f9-8ef0-1219891b6066',
    class: 'text',
    children: [
      { text: 'An example paragraph that contains text that is a wee bit ' },
      {
        text: 'stronger',
        'core/bold': true,
        'core/italic': true
      },
      { text: ' than normal but also text that is somewhat ' },
      {
        text: 'emphasized',
        'core/italic': true
      },
      { text: ' compared to the normal styled text found else where in the document.' }
    ]
  },
  {
    type: 'test/block',
    id: 'testblock-0002-0000-0000-000000000001',
    class: 'block',
    children: [
      {
        id: 'testblock-0002-0000-0000-000000000002',
        type: 'core/text',
        class: 'text',
        children: [{ text: 'Second test block at the end. Try ArrowLeft from the paragraph above.' }]
      }
    ]
  },
  {
    type: 'core/text',
    id: '538345e5-bacc-48f9-8ef0-1219891b6041',
    class: 'text',
    children: [
      { text: '' }
    ]
  }
]
