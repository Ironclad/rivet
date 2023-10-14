"use strict";(self.webpackChunkdocs=self.webpackChunkdocs||[]).push([[1330],{6593:(e,t,n)=>{n.d(t,{Zo:()=>s,kt:()=>h});var a=n(1644);function r(e,t,n){return t in e?Object.defineProperty(e,t,{value:n,enumerable:!0,configurable:!0,writable:!0}):e[t]=n,e}function o(e,t){var n=Object.keys(e);if(Object.getOwnPropertySymbols){var a=Object.getOwnPropertySymbols(e);t&&(a=a.filter((function(t){return Object.getOwnPropertyDescriptor(e,t).enumerable}))),n.push.apply(n,a)}return n}function l(e){for(var t=1;t<arguments.length;t++){var n=null!=arguments[t]?arguments[t]:{};t%2?o(Object(n),!0).forEach((function(t){r(e,t,n[t])})):Object.getOwnPropertyDescriptors?Object.defineProperties(e,Object.getOwnPropertyDescriptors(n)):o(Object(n)).forEach((function(t){Object.defineProperty(e,t,Object.getOwnPropertyDescriptor(n,t))}))}return e}function i(e,t){if(null==e)return{};var n,a,r=function(e,t){if(null==e)return{};var n,a,r={},o=Object.keys(e);for(a=0;a<o.length;a++)n=o[a],t.indexOf(n)>=0||(r[n]=e[n]);return r}(e,t);if(Object.getOwnPropertySymbols){var o=Object.getOwnPropertySymbols(e);for(a=0;a<o.length;a++)n=o[a],t.indexOf(n)>=0||Object.prototype.propertyIsEnumerable.call(e,n)&&(r[n]=e[n])}return r}var u=a.createContext({}),p=function(e){var t=a.useContext(u),n=t;return e&&(n="function"==typeof e?e(t):l(l({},t),e)),n},s=function(e){var t=p(e.components);return a.createElement(u.Provider,{value:t},e.children)},c="mdxType",d={inlineCode:"code",wrapper:function(e){var t=e.children;return a.createElement(a.Fragment,{},t)}},m=a.forwardRef((function(e,t){var n=e.components,r=e.mdxType,o=e.originalType,u=e.parentName,s=i(e,["components","mdxType","originalType","parentName"]),c=p(n),m=r,h=c["".concat(u,".").concat(m)]||c[m]||d[m]||o;return n?a.createElement(h,l(l({ref:t},s),{},{components:n})):a.createElement(h,l({ref:t},s))}));function h(e,t){var n=arguments,r=t&&t.mdxType;if("string"==typeof e||r){var o=n.length,l=new Array(o);l[0]=m;var i={};for(var u in t)hasOwnProperty.call(t,u)&&(i[u]=t[u]);i.originalType=e,i[c]="string"==typeof e?e:r,l[1]=i;for(var p=2;p<o;p++)l[p]=n[p];return a.createElement.apply(null,l)}return a.createElement.apply(null,n)}m.displayName="MDXCreateElement"},7026:(e,t,n)=>{n.d(t,{Z:()=>l});var a=n(1644),r=n(156);const o={tabItem:"tabItem_hFhF"};function l(e){let{children:t,hidden:n,className:l}=e;return a.createElement("div",{role:"tabpanel",className:(0,r.Z)(o.tabItem,l),hidden:n},t)}},6663:(e,t,n)=>{n.d(t,{Z:()=>v});var a=n(373),r=n(1644),o=n(156),l=n(1476),i=n(2824),u=n(9643),p=n(7190),s=n(6985);function c(e){return function(e){return r.Children.map(e,(e=>{if(!e||(0,r.isValidElement)(e)&&function(e){const{props:t}=e;return!!t&&"object"==typeof t&&"value"in t}(e))return e;throw new Error(`Docusaurus error: Bad <Tabs> child <${"string"==typeof e.type?e.type:e.type.name}>: all children of the <Tabs> component should be <TabItem>, and every <TabItem> should have a unique "value" prop.`)}))?.filter(Boolean)??[]}(e).map((e=>{let{props:{value:t,label:n,attributes:a,default:r}}=e;return{value:t,label:n,attributes:a,default:r}}))}function d(e){const{values:t,children:n}=e;return(0,r.useMemo)((()=>{const e=t??c(n);return function(e){const t=(0,p.l)(e,((e,t)=>e.value===t.value));if(t.length>0)throw new Error(`Docusaurus error: Duplicate values "${t.map((e=>e.value)).join(", ")}" found in <Tabs>. Every value needs to be unique.`)}(e),e}),[t,n])}function m(e){let{value:t,tabValues:n}=e;return n.some((e=>e.value===t))}function h(e){let{queryString:t=!1,groupId:n}=e;const a=(0,i.k6)(),o=function(e){let{queryString:t=!1,groupId:n}=e;if("string"==typeof t)return t;if(!1===t)return null;if(!0===t&&!n)throw new Error('Docusaurus error: The <Tabs> component groupId prop is required if queryString=true, because this value is used as the search param name. You can also provide an explicit value such as queryString="my-search-param".');return n??null}({queryString:t,groupId:n});return[(0,u._X)(o),(0,r.useCallback)((e=>{if(!o)return;const t=new URLSearchParams(a.location.search);t.set(o,e),a.replace({...a.location,search:t.toString()})}),[o,a])]}function f(e){const{defaultValue:t,queryString:n=!1,groupId:a}=e,o=d(e),[l,i]=(0,r.useState)((()=>function(e){let{defaultValue:t,tabValues:n}=e;if(0===n.length)throw new Error("Docusaurus error: the <Tabs> component requires at least one <TabItem> children component");if(t){if(!m({value:t,tabValues:n}))throw new Error(`Docusaurus error: The <Tabs> has a defaultValue "${t}" but none of its children has the corresponding value. Available values are: ${n.map((e=>e.value)).join(", ")}. If you intend to show no default tab, use defaultValue={null} instead.`);return t}const a=n.find((e=>e.default))??n[0];if(!a)throw new Error("Unexpected error: 0 tabValues");return a.value}({defaultValue:t,tabValues:o}))),[u,p]=h({queryString:n,groupId:a}),[c,f]=function(e){let{groupId:t}=e;const n=function(e){return e?`docusaurus.tab.${e}`:null}(t),[a,o]=(0,s.Nk)(n);return[a,(0,r.useCallback)((e=>{n&&o.set(e)}),[n,o])]}({groupId:a}),k=(()=>{const e=u??c;return m({value:e,tabValues:o})?e:null})();(0,r.useLayoutEffect)((()=>{k&&i(k)}),[k]);return{selectedValue:l,selectValue:(0,r.useCallback)((e=>{if(!m({value:e,tabValues:o}))throw new Error(`Can't select invalid tab value=${e}`);i(e),p(e),f(e)}),[p,f,o]),tabValues:o}}var k=n(8810);const N={tabList:"tabList_A6Ol",tabItem:"tabItem_djxK"};function g(e){let{className:t,block:n,selectedValue:i,selectValue:u,tabValues:p}=e;const s=[],{blockElementScrollPositionUntilNextRender:c}=(0,l.o5)(),d=e=>{const t=e.currentTarget,n=s.indexOf(t),a=p[n].value;a!==i&&(c(t),u(a))},m=e=>{let t=null;switch(e.key){case"Enter":d(e);break;case"ArrowRight":{const n=s.indexOf(e.currentTarget)+1;t=s[n]??s[0];break}case"ArrowLeft":{const n=s.indexOf(e.currentTarget)-1;t=s[n]??s[s.length-1];break}}t?.focus()};return r.createElement("ul",{role:"tablist","aria-orientation":"horizontal",className:(0,o.Z)("tabs",{"tabs--block":n},t)},p.map((e=>{let{value:t,label:n,attributes:l}=e;return r.createElement("li",(0,a.Z)({role:"tab",tabIndex:i===t?0:-1,"aria-selected":i===t,key:t,ref:e=>s.push(e),onKeyDown:m,onClick:d},l,{className:(0,o.Z)("tabs__item",N.tabItem,l?.className,{"tabs__item--active":i===t})}),n??t)})))}function b(e){let{lazy:t,children:n,selectedValue:a}=e;const o=(Array.isArray(n)?n:[n]).filter(Boolean);if(t){const e=o.find((e=>e.props.value===a));return e?(0,r.cloneElement)(e,{className:"margin-top--md"}):null}return r.createElement("div",{className:"margin-top--md"},o.map(((e,t)=>(0,r.cloneElement)(e,{key:t,hidden:e.props.value!==a}))))}function y(e){const t=f(e);return r.createElement("div",{className:(0,o.Z)("tabs-container",N.tabList)},r.createElement(g,(0,a.Z)({},e,t)),r.createElement(b,(0,a.Z)({},e,t)))}function v(e){const t=(0,k.Z)();return r.createElement(y,(0,a.Z)({key:String(t)},e))}},6874:(e,t,n)=>{n.r(t),n.d(t,{assets:()=>s,contentTitle:()=>u,default:()=>h,frontMatter:()=>i,metadata:()=>p,toc:()=>c});var a=n(373),r=(n(1644),n(6593)),o=n(6663),l=n(7026);const i={id:"gpt-function",title:"GPT Function Node",sidebar_label:"GPT Function"},u=void 0,p={unversionedId:"node-reference/gpt-function",id:"node-reference/gpt-function",title:"GPT Function Node",description:"GPT Function Node Screenshot",source:"@site/docs/node-reference/gpt-function.mdx",sourceDirName:"node-reference",slug:"/node-reference/gpt-function",permalink:"/docs/node-reference/gpt-function",draft:!1,editUrl:"https://github.com/ironclad/rivet/tree/main/packages/docs/docs/node-reference/gpt-function.mdx",tags:[],version:"current",frontMatter:{id:"gpt-function",title:"GPT Function Node",sidebar_label:"GPT Function"},sidebar:"nodeReference",previous:{title:"Chat",permalink:"/docs/node-reference/chat"},next:{title:"Get Embedding",permalink:"/docs/node-reference/get-embedding"}},s={},c=[{value:"Overview",id:"overview",level:2},{value:"Outputs",id:"outputs",level:2},{value:"Editor Settings",id:"editor-settings",level:2},{value:"Example 1: Define a function that takes a single string parameter",id:"example-1-define-a-function-that-takes-a-single-string-parameter",level:2},{value:"Error Handling",id:"error-handling",level:2},{value:"FAQ",id:"faq",level:2},{value:"See Also",id:"see-also",level:2}],d={toc:c},m="wrapper";function h(e){let{components:t,...i}=e;return(0,r.kt)(m,(0,a.Z)({},d,i,{components:t,mdxType:"MDXLayout"}),(0,r.kt)("p",null,(0,r.kt)("img",{alt:"GPT Function Node Screenshot",src:n(7083).Z,width:"339",height:"171"})),(0,r.kt)("h2",{id:"overview"},"Overview"),(0,r.kt)("p",null,"The GPT Function Node allows you to define a function that can be called by OpenAI's GPT in its responses. This is part of GPT's \"function-calling\" capability. The function is defined using JSON Schema."),(0,r.kt)("p",null,'The output of the GPT Function Node can be passed into the "Function" port of the ',(0,r.kt)("a",{parentName:"p",href:"/docs/node-reference/chat"},"Chat Node"),'. To enable this, you must check the "Enable Function Calling" setting in the Chat Node.'),(0,r.kt)("p",null,"If you want to pass multiple functions into a Chat Node, all of the functions should be passed into an ",(0,r.kt)("a",{parentName:"p",href:"/docs/node-reference/array"},"Array Node"),', and the Array Node goes into the "Function" port of the Chat Node.'),(0,r.kt)("p",null,"A function is defined using JSON Schema, which is a vocabulary that allows you to annotate and validate JSON documents. For more information on JSON Schema, see the ",(0,r.kt)("a",{parentName:"p",href:"https://json-schema.org/"},"official website"),"."),(0,r.kt)(o.Z,{defaultValue:"inputs",values:[{label:"Inputs",value:"inputs"},{label:"Outputs",value:"outputs"},{label:"Editor Settings",value:"settings"}],mdxType:"Tabs"},(0,r.kt)(l.Z,{value:"inputs",mdxType:"TabItem"},(0,r.kt)("p",null,"The GPT Function Node does not have any inputs.")),(0,r.kt)(l.Z,{value:"outputs",mdxType:"TabItem"},(0,r.kt)("h2",{id:"outputs"},"Outputs"),(0,r.kt)("table",null,(0,r.kt)("thead",{parentName:"table"},(0,r.kt)("tr",{parentName:"thead"},(0,r.kt)("th",{parentName:"tr",align:null},"Title"),(0,r.kt)("th",{parentName:"tr",align:null},"Data Type"),(0,r.kt)("th",{parentName:"tr",align:null},"Description"),(0,r.kt)("th",{parentName:"tr",align:null},"Notes"))),(0,r.kt)("tbody",{parentName:"table"},(0,r.kt)("tr",{parentName:"tbody"},(0,r.kt)("td",{parentName:"tr",align:null},"Function"),(0,r.kt)("td",{parentName:"tr",align:null},(0,r.kt)("inlineCode",{parentName:"td"},"gpt-function")),(0,r.kt)("td",{parentName:"tr",align:null},'The function that was defined. This output can be connected to the "Function" port of a ',(0,r.kt)("a",{parentName:"td",href:"/docs/node-reference/chat"},"Chat Node"),"."),(0,r.kt)("td",{parentName:"tr",align:null}))))),(0,r.kt)(l.Z,{value:"settings",mdxType:"TabItem"},(0,r.kt)("h2",{id:"editor-settings"},"Editor Settings"),(0,r.kt)("table",null,(0,r.kt)("thead",{parentName:"table"},(0,r.kt)("tr",{parentName:"thead"},(0,r.kt)("th",{parentName:"tr",align:null},"Setting"),(0,r.kt)("th",{parentName:"tr",align:null},"Description"),(0,r.kt)("th",{parentName:"tr",align:null},"Default Value"),(0,r.kt)("th",{parentName:"tr",align:null},"Use Input Toggle"),(0,r.kt)("th",{parentName:"tr",align:null},"Input Data Type"))),(0,r.kt)("tbody",{parentName:"table"},(0,r.kt)("tr",{parentName:"tbody"},(0,r.kt)("td",{parentName:"tr",align:null},"Name"),(0,r.kt)("td",{parentName:"tr",align:null},"The name of the function. This is the name that GPT will use to call the function in its responses."),(0,r.kt)("td",{parentName:"tr",align:null},(0,r.kt)("inlineCode",{parentName:"td"},"newFunction")),(0,r.kt)("td",{parentName:"tr",align:null},"No"),(0,r.kt)("td",{parentName:"tr",align:null},(0,r.kt)("inlineCode",{parentName:"td"},"string"))),(0,r.kt)("tr",{parentName:"tbody"},(0,r.kt)("td",{parentName:"tr",align:null},"Description"),(0,r.kt)("td",{parentName:"tr",align:null},"A description of the function. This is used for documentation purposes and does not affect the function's behavior."),(0,r.kt)("td",{parentName:"tr",align:null},"(empty)"),(0,r.kt)("td",{parentName:"tr",align:null},"No"),(0,r.kt)("td",{parentName:"tr",align:null},(0,r.kt)("inlineCode",{parentName:"td"},"string"))),(0,r.kt)("tr",{parentName:"tbody"},(0,r.kt)("td",{parentName:"tr",align:null},"Schema"),(0,r.kt)("td",{parentName:"tr",align:null},"The JSON Schema that defines the function's parameters."),(0,r.kt)("td",{parentName:"tr",align:null},"(empty)"),(0,r.kt)("td",{parentName:"tr",align:null},"No"),(0,r.kt)("td",{parentName:"tr",align:null},(0,r.kt)("inlineCode",{parentName:"td"},"string"))))))),(0,r.kt)("h2",{id:"example-1-define-a-function-that-takes-a-single-string-parameter"},"Example 1: Define a function that takes a single string parameter"),(0,r.kt)("ol",null,(0,r.kt)("li",{parentName:"ol"},(0,r.kt)("p",{parentName:"li"},"Create a GPT Function Node.")),(0,r.kt)("li",{parentName:"ol"},(0,r.kt)("p",{parentName:"li"},"Set the ",(0,r.kt)("inlineCode",{parentName:"p"},"Name")," to ",(0,r.kt)("inlineCode",{parentName:"p"},"greet"),".")),(0,r.kt)("li",{parentName:"ol"},(0,r.kt)("p",{parentName:"li"},"Set the ",(0,r.kt)("inlineCode",{parentName:"p"},"Description")," to ",(0,r.kt)("inlineCode",{parentName:"p"},"A function that greets a user"),".")),(0,r.kt)("li",{parentName:"ol"},(0,r.kt)("p",{parentName:"li"},"Set the ",(0,r.kt)("inlineCode",{parentName:"p"},"Schema")," to the following:"),(0,r.kt)("pre",{parentName:"li"},(0,r.kt)("code",{parentName:"pre",className:"language-json"},'{\n  "type": "object",\n  "properties": {\n    "name": {\n      "type": "string",\n      "description": "The name of the user"\n    }\n  },\n  "required": ["name"]\n}\n'))),(0,r.kt)("li",{parentName:"ol"},(0,r.kt)("p",{parentName:"li"},"Create a ",(0,r.kt)("a",{parentName:"p",href:"/docs/node-reference/chat"},"Chat Node"),' and enable the "Function" input port by checking the "Enable Function Calling" setting.')),(0,r.kt)("li",{parentName:"ol"},(0,r.kt)("p",{parentName:"li"},"Connect the ",(0,r.kt)("inlineCode",{parentName:"p"},"Function")," output of the GPT Function Node to the ",(0,r.kt)("inlineCode",{parentName:"p"},"Function")," input of the Chat Node.")),(0,r.kt)("li",{parentName:"ol"},(0,r.kt)("p",{parentName:"li"},"Set the ",(0,r.kt)("inlineCode",{parentName:"p"},"Prompt")," of the Chat Node to the following, using a ",(0,r.kt)("a",{parentName:"p",href:"/docs/node-reference/text"},"Text Node")," or ",(0,r.kt)("a",{parentName:"p",href:"/docs/node-reference/prompt"},"Prompt Node"),":"),(0,r.kt)("pre",{parentName:"li"},(0,r.kt)("code",{parentName:"pre"},'Please call the `greet` function with the name "John Doe".\n'))),(0,r.kt)("li",{parentName:"ol"},(0,r.kt)("p",{parentName:"li"},"Run the graph. The Chat Node should output a call to the ",(0,r.kt)("inlineCode",{parentName:"p"},"greet")," function with the parameter ",(0,r.kt)("inlineCode",{parentName:"p"},"name")," set to ",(0,r.kt)("inlineCode",{parentName:"p"},'"John Doe"'),"."))),(0,r.kt)("p",null,(0,r.kt)("img",{alt:"GPT Function Node Example 1",src:n(4709).Z,width:"836",height:"405"})),(0,r.kt)("h2",{id:"error-handling"},"Error Handling"),(0,r.kt)("p",null,"The GPT Function Node will error if the ",(0,r.kt)("inlineCode",{parentName:"p"},"Schema")," is not a valid JSON string or if it does not represent a valid JSON Schema."),(0,r.kt)("h2",{id:"faq"},"FAQ"),(0,r.kt)("p",null,(0,r.kt)("strong",{parentName:"p"},"Q: Can I define a function that takes multiple parameters?")),(0,r.kt)("p",null,"A: Yes, you can define a function that takes multiple parameters by adding more properties to the ",(0,r.kt)("inlineCode",{parentName:"p"},"Schema"),". Each property represents a parameter of the function."),(0,r.kt)("p",null,(0,r.kt)("strong",{parentName:"p"},"Q: Can I define a function that takes an array or an object as a parameter?")),(0,r.kt)("p",null,"A: Yes, you can define a function that takes an array or an object as a parameter by setting the ",(0,r.kt)("inlineCode",{parentName:"p"},"type")," of the property in the ",(0,r.kt)("inlineCode",{parentName:"p"},"Schema")," to ",(0,r.kt)("inlineCode",{parentName:"p"},"array")," or ",(0,r.kt)("inlineCode",{parentName:"p"},"object"),"."),(0,r.kt)("p",null,(0,r.kt)("strong",{parentName:"p"},"Q: Can I define a function that does not take any parameters?")),(0,r.kt)("p",null,"A: Yes, you can define a function that does not take any parameters by setting the ",(0,r.kt)("inlineCode",{parentName:"p"},"Schema")," to an empty object (",(0,r.kt)("inlineCode",{parentName:"p"},"{}"),")."),(0,r.kt)("p",null,(0,r.kt)("strong",{parentName:"p"},"Q: Can I use the GPT Function Node to define a function that returns a value?")),(0,r.kt)("p",null,"A: No, the GPT Function Node only defines the function's name and parameters. The function's behavior is determined by the rest of the graph."),(0,r.kt)("p",null,(0,r.kt)("strong",{parentName:"p"},"Q: How can I connect multiple functions to a Chat Node?")),(0,r.kt)("p",null,"A: You can connect multiple functions to a Chat Node by passing all of the functions into an ",(0,r.kt)("a",{parentName:"p",href:"/docs/node-reference/array"},"Array Node"),", and then connecting the Array Node to the Chat Node."),(0,r.kt)("h2",{id:"see-also"},"See Also"),(0,r.kt)("ul",null,(0,r.kt)("li",{parentName:"ul"},(0,r.kt)("a",{parentName:"li",href:"/docs/node-reference/chat"},"Chat Node")),(0,r.kt)("li",{parentName:"ul"},(0,r.kt)("a",{parentName:"li",href:"/docs/node-reference/array"},"Array Node")),(0,r.kt)("li",{parentName:"ul"},(0,r.kt)("a",{parentName:"li",href:"https://json-schema.org/"},"JSON Schema")),(0,r.kt)("li",{parentName:"ul"},(0,r.kt)("a",{parentName:"li",href:"https://platform.openai.com/docs/guides/gpt/function-calling"},"Function Calling Documentation"))))}h.isMDXComponent=!0},4709:(e,t,n)=>{n.d(t,{Z:()=>a});const a=n.p+"assets/images/gpt-function-node-example-01-68ae1b73a2b150e64432573a88d386cc.png"},7083:(e,t,n)=>{n.d(t,{Z:()=>a});const a=n.p+"assets/images/gpt-function-node-025def5dccfb7e008cf48f20ce2345eb.png"}}]);