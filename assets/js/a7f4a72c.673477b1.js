"use strict";(self.webpackChunkdocs=self.webpackChunkdocs||[]).push([[4170],{6593:(e,t,r)=>{r.d(t,{Zo:()=>d,kt:()=>h});var a=r(1644);function n(e,t,r){return t in e?Object.defineProperty(e,t,{value:r,enumerable:!0,configurable:!0,writable:!0}):e[t]=r,e}function l(e,t){var r=Object.keys(e);if(Object.getOwnPropertySymbols){var a=Object.getOwnPropertySymbols(e);t&&(a=a.filter((function(t){return Object.getOwnPropertyDescriptor(e,t).enumerable}))),r.push.apply(r,a)}return r}function o(e){for(var t=1;t<arguments.length;t++){var r=null!=arguments[t]?arguments[t]:{};t%2?l(Object(r),!0).forEach((function(t){n(e,t,r[t])})):Object.getOwnPropertyDescriptors?Object.defineProperties(e,Object.getOwnPropertyDescriptors(r)):l(Object(r)).forEach((function(t){Object.defineProperty(e,t,Object.getOwnPropertyDescriptor(r,t))}))}return e}function u(e,t){if(null==e)return{};var r,a,n=function(e,t){if(null==e)return{};var r,a,n={},l=Object.keys(e);for(a=0;a<l.length;a++)r=l[a],t.indexOf(r)>=0||(n[r]=e[r]);return n}(e,t);if(Object.getOwnPropertySymbols){var l=Object.getOwnPropertySymbols(e);for(a=0;a<l.length;a++)r=l[a],t.indexOf(r)>=0||Object.prototype.propertyIsEnumerable.call(e,r)&&(n[r]=e[r])}return n}var i=a.createContext({}),s=function(e){var t=a.useContext(i),r=t;return e&&(r="function"==typeof e?e(t):o(o({},t),e)),r},d=function(e){var t=s(e.components);return a.createElement(i.Provider,{value:t},e.children)},c="mdxType",f={inlineCode:"code",wrapper:function(e){var t=e.children;return a.createElement(a.Fragment,{},t)}},p=a.forwardRef((function(e,t){var r=e.components,n=e.mdxType,l=e.originalType,i=e.parentName,d=u(e,["components","mdxType","originalType","parentName"]),c=s(r),p=n,h=c["".concat(i,".").concat(p)]||c[p]||f[p]||l;return r?a.createElement(h,o(o({ref:t},d),{},{components:r})):a.createElement(h,o({ref:t},d))}));function h(e,t){var r=arguments,n=t&&t.mdxType;if("string"==typeof e||n){var l=r.length,o=new Array(l);o[0]=p;var u={};for(var i in t)hasOwnProperty.call(t,i)&&(u[i]=t[i]);u.originalType=e,u[c]="string"==typeof e?e:n,o[1]=u;for(var s=2;s<l;s++)o[s]=r[s];return a.createElement.apply(null,o)}return a.createElement.apply(null,r)}p.displayName="MDXCreateElement"},7026:(e,t,r)=>{r.d(t,{Z:()=>o});var a=r(1644),n=r(156);const l={tabItem:"tabItem_hFhF"};function o(e){let{children:t,hidden:r,className:o}=e;return a.createElement("div",{role:"tabpanel",className:(0,n.Z)(l.tabItem,o),hidden:r},t)}},6663:(e,t,r)=>{r.d(t,{Z:()=>N});var a=r(373),n=r(1644),l=r(156),o=r(1476),u=r(2824),i=r(9643),s=r(7190),d=r(6985);function c(e){return function(e){return n.Children.map(e,(e=>{if(!e||(0,n.isValidElement)(e)&&function(e){const{props:t}=e;return!!t&&"object"==typeof t&&"value"in t}(e))return e;throw new Error(`Docusaurus error: Bad <Tabs> child <${"string"==typeof e.type?e.type:e.type.name}>: all children of the <Tabs> component should be <TabItem>, and every <TabItem> should have a unique "value" prop.`)}))?.filter(Boolean)??[]}(e).map((e=>{let{props:{value:t,label:r,attributes:a,default:n}}=e;return{value:t,label:r,attributes:a,default:n}}))}function f(e){const{values:t,children:r}=e;return(0,n.useMemo)((()=>{const e=t??c(r);return function(e){const t=(0,s.l)(e,((e,t)=>e.value===t.value));if(t.length>0)throw new Error(`Docusaurus error: Duplicate values "${t.map((e=>e.value)).join(", ")}" found in <Tabs>. Every value needs to be unique.`)}(e),e}),[t,r])}function p(e){let{value:t,tabValues:r}=e;return r.some((e=>e.value===t))}function h(e){let{queryString:t=!1,groupId:r}=e;const a=(0,u.k6)(),l=function(e){let{queryString:t=!1,groupId:r}=e;if("string"==typeof t)return t;if(!1===t)return null;if(!0===t&&!r)throw new Error('Docusaurus error: The <Tabs> component groupId prop is required if queryString=true, because this value is used as the search param name. You can also provide an explicit value such as queryString="my-search-param".');return r??null}({queryString:t,groupId:r});return[(0,i._X)(l),(0,n.useCallback)((e=>{if(!l)return;const t=new URLSearchParams(a.location.search);t.set(l,e),a.replace({...a.location,search:t.toString()})}),[l,a])]}function m(e){const{defaultValue:t,queryString:r=!1,groupId:a}=e,l=f(e),[o,u]=(0,n.useState)((()=>function(e){let{defaultValue:t,tabValues:r}=e;if(0===r.length)throw new Error("Docusaurus error: the <Tabs> component requires at least one <TabItem> children component");if(t){if(!p({value:t,tabValues:r}))throw new Error(`Docusaurus error: The <Tabs> has a defaultValue "${t}" but none of its children has the corresponding value. Available values are: ${r.map((e=>e.value)).join(", ")}. If you intend to show no default tab, use defaultValue={null} instead.`);return t}const a=r.find((e=>e.default))??r[0];if(!a)throw new Error("Unexpected error: 0 tabValues");return a.value}({defaultValue:t,tabValues:l}))),[i,s]=h({queryString:r,groupId:a}),[c,m]=function(e){let{groupId:t}=e;const r=function(e){return e?`docusaurus.tab.${e}`:null}(t),[a,l]=(0,d.Nk)(r);return[a,(0,n.useCallback)((e=>{r&&l.set(e)}),[r,l])]}({groupId:a}),b=(()=>{const e=i??c;return p({value:e,tabValues:l})?e:null})();(0,n.useLayoutEffect)((()=>{b&&u(b)}),[b]);return{selectedValue:o,selectValue:(0,n.useCallback)((e=>{if(!p({value:e,tabValues:l}))throw new Error(`Can't select invalid tab value=${e}`);u(e),s(e),m(e)}),[s,m,l]),tabValues:l}}var b=r(8810);const k={tabList:"tabList_A6Ol",tabItem:"tabItem_djxK"};function g(e){let{className:t,block:r,selectedValue:u,selectValue:i,tabValues:s}=e;const d=[],{blockElementScrollPositionUntilNextRender:c}=(0,o.o5)(),f=e=>{const t=e.currentTarget,r=d.indexOf(t),a=s[r].value;a!==u&&(c(t),i(a))},p=e=>{let t=null;switch(e.key){case"Enter":f(e);break;case"ArrowRight":{const r=d.indexOf(e.currentTarget)+1;t=d[r]??d[0];break}case"ArrowLeft":{const r=d.indexOf(e.currentTarget)-1;t=d[r]??d[d.length-1];break}}t?.focus()};return n.createElement("ul",{role:"tablist","aria-orientation":"horizontal",className:(0,l.Z)("tabs",{"tabs--block":r},t)},s.map((e=>{let{value:t,label:r,attributes:o}=e;return n.createElement("li",(0,a.Z)({role:"tab",tabIndex:u===t?0:-1,"aria-selected":u===t,key:t,ref:e=>d.push(e),onKeyDown:p,onClick:f},o,{className:(0,l.Z)("tabs__item",k.tabItem,o?.className,{"tabs__item--active":u===t})}),r??t)})))}function y(e){let{lazy:t,children:r,selectedValue:a}=e;const l=(Array.isArray(r)?r:[r]).filter(Boolean);if(t){const e=l.find((e=>e.props.value===a));return e?(0,n.cloneElement)(e,{className:"margin-top--md"}):null}return n.createElement("div",{className:"margin-top--md"},l.map(((e,t)=>(0,n.cloneElement)(e,{key:t,hidden:e.props.value!==a}))))}function v(e){const t=m(e);return n.createElement("div",{className:(0,l.Z)("tabs-container",k.tabList)},n.createElement(g,(0,a.Z)({},e,t)),n.createElement(y,(0,a.Z)({},e,t)))}function N(e){const t=(0,b.Z)();return n.createElement(v,(0,a.Z)({key:String(t)},e))}},2280:(e,t,r)=>{r.r(t),r.d(t,{assets:()=>d,contentTitle:()=>i,default:()=>h,frontMatter:()=>u,metadata:()=>s,toc:()=>c});var a=r(373),n=(r(1644),r(6593)),l=r(6663),o=r(7026);const u={id:"shuffle",title:"Shuffle Node",sidebar_label:"Shuffle"},i=void 0,s={unversionedId:"node-reference/shuffle",id:"node-reference/shuffle",title:"Shuffle Node",description:"Shuffle Node Screenshot",source:"@site/docs/node-reference/shuffle.mdx",sourceDirName:"node-reference",slug:"/node-reference/shuffle",permalink:"/docs/node-reference/shuffle",draft:!1,editUrl:"https://github.com/ironclad/rivet/tree/main/packages/docs/docs/node-reference/shuffle.mdx",tags:[],version:"current",frontMatter:{id:"shuffle",title:"Shuffle Node",sidebar_label:"Shuffle"},sidebar:"nodeReference",previous:{title:"Pop",permalink:"/docs/node-reference/pop"},next:{title:"Slice",permalink:"/docs/node-reference/slice"}},d={},c=[{value:"Overview",id:"overview",level:2},{value:"Inputs",id:"inputs",level:2},{value:"Outputs",id:"outputs",level:2},{value:"Editor Settings",id:"editor-settings",level:2},{value:"Example 1: Shuffle an array of numbers",id:"example-1-shuffle-an-array-of-numbers",level:2},{value:"Error Handling",id:"error-handling",level:2},{value:"FAQ",id:"faq",level:2},{value:"See Also",id:"see-also",level:2}],f={toc:c},p="wrapper";function h(e){let{components:t,...u}=e;return(0,n.kt)(p,(0,a.Z)({},f,u,{components:t,mdxType:"MDXLayout"}),(0,n.kt)("p",null,(0,n.kt)("img",{alt:"Shuffle Node Screenshot",src:r(8912).Z,width:"296",height:"152"})),(0,n.kt)("h2",{id:"overview"},"Overview"),(0,n.kt)("p",null,"The Shuffle Node is used to randomize the order of elements in an array. It takes an array as input and outputs a new array with the elements in a shuffled order."),(0,n.kt)("p",null,"The Shuffle Node uses the ",(0,n.kt)("a",{parentName:"p",href:"https://en.wikipedia.org/wiki/Fisher%E2%80%93Yates_shuffle"},"Fisher-Yates (aka Knuth) shuffle algorithm")," to ensure a fair distribution of permutations."),(0,n.kt)(l.Z,{defaultValue:"inputs",values:[{label:"Inputs",value:"inputs"},{label:"Outputs",value:"outputs"},{label:"Editor Settings",value:"settings"}],mdxType:"Tabs"},(0,n.kt)(o.Z,{value:"inputs",mdxType:"TabItem"},(0,n.kt)("h2",{id:"inputs"},"Inputs"),(0,n.kt)("table",null,(0,n.kt)("thead",{parentName:"table"},(0,n.kt)("tr",{parentName:"thead"},(0,n.kt)("th",{parentName:"tr",align:null},"Title"),(0,n.kt)("th",{parentName:"tr",align:null},"Data Type"),(0,n.kt)("th",{parentName:"tr",align:null},"Description"),(0,n.kt)("th",{parentName:"tr",align:null},"Default Value"),(0,n.kt)("th",{parentName:"tr",align:null},"Notes"))),(0,n.kt)("tbody",{parentName:"table"},(0,n.kt)("tr",{parentName:"tbody"},(0,n.kt)("td",{parentName:"tr",align:null},"Array"),(0,n.kt)("td",{parentName:"tr",align:null},(0,n.kt)("inlineCode",{parentName:"td"},"any[]")),(0,n.kt)("td",{parentName:"tr",align:null},"The array to shuffle."),(0,n.kt)("td",{parentName:"tr",align:null},"(required)"),(0,n.kt)("td",{parentName:"tr",align:null},"None"))))),(0,n.kt)(o.Z,{value:"outputs",mdxType:"TabItem"},(0,n.kt)("h2",{id:"outputs"},"Outputs"),(0,n.kt)("table",null,(0,n.kt)("thead",{parentName:"table"},(0,n.kt)("tr",{parentName:"thead"},(0,n.kt)("th",{parentName:"tr",align:null},"Title"),(0,n.kt)("th",{parentName:"tr",align:null},"Data Type"),(0,n.kt)("th",{parentName:"tr",align:null},"Description"),(0,n.kt)("th",{parentName:"tr",align:null},"Notes"))),(0,n.kt)("tbody",{parentName:"table"},(0,n.kt)("tr",{parentName:"tbody"},(0,n.kt)("td",{parentName:"tr",align:null},"Shuffled"),(0,n.kt)("td",{parentName:"tr",align:null},(0,n.kt)("inlineCode",{parentName:"td"},"any[]")),(0,n.kt)("td",{parentName:"tr",align:null},"The input array with its order randomized."),(0,n.kt)("td",{parentName:"tr",align:null},"None"))))),(0,n.kt)(o.Z,{value:"settings",mdxType:"TabItem"},(0,n.kt)("h2",{id:"editor-settings"},"Editor Settings"),(0,n.kt)("p",null,"This node has no configurable editor settings."))),(0,n.kt)("h2",{id:"example-1-shuffle-an-array-of-numbers"},"Example 1: Shuffle an array of numbers"),(0,n.kt)("ol",null,(0,n.kt)("li",{parentName:"ol"},"Create an ",(0,n.kt)("a",{parentName:"li",href:"/docs/node-reference/array"},"Array Node")," and set the values to ",(0,n.kt)("inlineCode",{parentName:"li"},"[1, 2, 3, 4, 5]"),"."),(0,n.kt)("li",{parentName:"ol"},"Create a Shuffle Node and connect the Array Node to its ",(0,n.kt)("inlineCode",{parentName:"li"},"Array")," input."),(0,n.kt)("li",{parentName:"ol"},"Run the graph. The ",(0,n.kt)("inlineCode",{parentName:"li"},"Shuffled")," output of the Shuffle Node should contain the numbers 1 through 5 in a random order.")),(0,n.kt)("p",null,(0,n.kt)("img",{alt:"Shuffle Node Example 1",src:r(8054).Z,width:"975",height:"814"})),(0,n.kt)("h2",{id:"error-handling"},"Error Handling"),(0,n.kt)("p",null,"The Shuffle Node will error if the ",(0,n.kt)("inlineCode",{parentName:"p"},"Array")," input is not provided or is not an array."),(0,n.kt)("h2",{id:"faq"},"FAQ"),(0,n.kt)("p",null,(0,n.kt)("strong",{parentName:"p"},"Q: Can I shuffle an array of objects?")),(0,n.kt)("p",null,"A: Yes, the Shuffle Node can shuffle arrays of any data type, including objects."),(0,n.kt)("p",null,(0,n.kt)("strong",{parentName:"p"},"Q: Does the Shuffle Node modify the original array?")),(0,n.kt)("p",null,"A: No, the Shuffle Node does not modify the original array. It creates a new array with the elements in a shuffled order."),(0,n.kt)("p",null,(0,n.kt)("strong",{parentName:"p"},"Q: Is the shuffle algorithm truly random?")),(0,n.kt)("p",null,"A: The Shuffle Node uses the Fisher-Yates (aka Knuth) shuffle algorithm, which is considered a fair shuffle algorithm. However, it relies on the JavaScript ",(0,n.kt)("inlineCode",{parentName:"p"},"Math.random()")," function, which is not suitable for cryptographic purposes."),(0,n.kt)("h2",{id:"see-also"},"See Also"),(0,n.kt)("ul",null,(0,n.kt)("li",{parentName:"ul"},(0,n.kt)("a",{parentName:"li",href:"/docs/node-reference/array"},"Array Node")),(0,n.kt)("li",{parentName:"ul"},(0,n.kt)("a",{parentName:"li",href:"/docs/node-reference/filter"},"Filter Node")),(0,n.kt)("li",{parentName:"ul"},(0,n.kt)("a",{parentName:"li",href:"/docs/node-reference/join"},"Join Node")),(0,n.kt)("li",{parentName:"ul"},(0,n.kt)("a",{parentName:"li",href:"/docs/node-reference/code"},"Code Node")),(0,n.kt)("li",{parentName:"ul"},(0,n.kt)("a",{parentName:"li",href:"/docs/node-reference/RNG"},"RNG Node"))))}h.isMDXComponent=!0},8054:(e,t,r)=>{r.d(t,{Z:()=>a});const a=r.p+"assets/images/shuffle-node-example-01-b33b49954e34a6b374dce048b337dd0d.png"},8912:(e,t,r)=>{r.d(t,{Z:()=>a});const a=r.p+"assets/images/shuffle-node-a6ed786b53219eb3da397b02d506f27a.png"}}]);