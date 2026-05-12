type DescribableFunction = {
  description : string,
  (someArg : number) : boolean;
};

function doSomething(fn : DescribableFunction){
  console.log(fn.description + " returned " + fn(6));
}

function myFunc(someArg : number){
  return someArg > 3;
}
myFunc.description = "default description";

doSomething(myFunc);


interface CallOrConstruct {
  (n?: number): string;      
  new (s: string): Date;    
}

function fn(ctor: CallOrConstruct){
  console.log(new ctor(10));
  console.log(new ctor("10"));
}

fn(Date);
