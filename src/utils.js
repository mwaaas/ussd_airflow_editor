import { Base64 } from 'js-base64'
import utils from 'mermaid/src/utils'
import gitGraphParser from 'mermaid/src/diagrams/git/parser/gitGraph'
import gitGraphAst from 'mermaid/src/diagrams/git/gitGraphAst'
import flowParser from 'mermaid/src/diagrams/flowchart/parser/flow'
import flowDb from 'mermaid/src/diagrams/flowchart/flowDb'
import sequenceParser from 'mermaid/src/diagrams/sequence/parser/sequenceDiagram'
import sequenceDb from 'mermaid/src/diagrams/sequence/sequenceDb'
import ganttParser from 'mermaid/src/diagrams/gantt/parser/gantt'
import ganttDb from 'mermaid/src/diagrams/gantt/ganttDb'
import classParser from 'mermaid/src/diagrams/class/parser/classDiagram'
import classDb from 'mermaid/src/diagrams/class/classDb'

export const base64ToState = (base64, search) => {
  // for backward compatibility
  const params = new window.URLSearchParams(search)
  const themeFromUrl = params.get('theme') || 'default'

  const str = Base64.decode(base64)
  let state
  try {
    state = JSON.parse(str)
    if (state.code === undefined) { // not valid json
      state = { code: str, mermaid: { theme: themeFromUrl } }
    }
  } catch (e) {
    state = { code: str, mermaid: { theme: themeFromUrl } }
  }
  return state
}

const defaultCode = {
  'initial_screen': {
    'type': 'initial_screen',
    'next_screen': 'enter_height',
    'default_language': 'en'
  },
  'enter_height': {
    'type': 'input_screen',
    'text': {
      'en': 'Enter your height\\n',
      'sw': 'Weka ukubwa lako\\n'
    },
    'input_identifier': 'height',
    'default_next_screen': 'enter_age',
    'next_screen': [
      {
        'condition': 'input|int == 60',
        'next_screen': 'height_above_60'
      },
      {
        'condition': 'input|int == 30',
        'next_screen': 'height_below_30'
      }
    ],
    'validators': [
      {
        'regex': '^[0-9]{1,7}$',
        'text': {
          'en': 'Enter number between 1 and 7\\n',
          'sw': 'Weka namba kutoka 1 hadi 7\\n'
        }
      }
    ]
  },
  'enter_age': {
    'type': 'input_screen',
    'text': {
      'en': 'Enter your age\\n',
      'sw': 'Weka miaka yako\\n'
    },
    'input_identifier': 'age',
    'next_screen': 'show_information',
    'options': [
      {
        'text': {
          'en': 'back',
          'sw': 'rudi'
        },
        'next_screen': 'enter_height'
      }
    ],
    'validators': [
      {
        'regex': '^[0-9]{1,7}$',
        'text': {
          'en': 'Only nubers are allowed\\n',
          'sw': 'Nambari pekee ndio zimekubalishwa\\n',
          'default': 'en'
        }
      },
      {
        'expression': 'ussd_request.input|int < 100',
        'text': {
          'en': 'Number over 100 is not allowed\\n',
          'sw': 'Nambari juu ya 100 haikubalishwi\\n'
        }
      }
    ]
  },
  'show_information': {
    'text': {
      'en': 'Your age is {{ age }} and your height is {{ height }}.\\nEnter anything to go back to the first screen\\n',
      'sw': 'Miaka yako in {{ age }} na ukubwa wako in {{ height }}.\\nWeka kitu ingine yoyote unende kwenye screen ya kwanza\\n'
    },
    'type': 'input_screen',
    'input_identifier': 'foo',
    'next_screen': 'enter_height'
  },
  'height_above_60': {
    'type': 'quit_screen',
    'text': 'We are not interested with height above 60'
  },
  'height_below_30': {
    'type': 'quit_screen',
    'text': 'We are not interested with height below 30'
  }
}
export const defaultState = {
  code: defaultCode,
  mermaid: { theme: 'default' }
}

export function parseMermaidText (text) {
  const graphType = utils.detectType(text)
  let parser
  let data
  switch (graphType) {
    case 'git':
      parser = gitGraphParser
      data = gitGraphAst
      break
    case 'flowchart':
      parser = flowParser
      data = flowDb
      break
    case 'sequence':
      parser = sequenceParser
      data = sequenceDb
      break
    case 'gantt':
      parser = ganttParser
      data = ganttDb
      break
    case 'class':
      parser = classParser
      data = classDb
      break
  }
  parser.parser.yy = data

  parser.parser.yy.parseError = (str, hash) => {
    const error = { str, hash }
    throw error
  }

  parser.parse(text)
  return data
}
