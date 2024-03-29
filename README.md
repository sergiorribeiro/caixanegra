# caixanegra
![Gem](https://img.shields.io/gem/v/caixanegra?logo=ruby&logoColor=red)

An unopinionated flow oriented blackbox designer, executor and debugger to interface your service classes and allow users to manipulate or completely redesign processes using your code.

# Installation
Add this line to your application's Gemfile:

```ruby
gem 'caixanegra'
```

or 

```
bundler add caixanegra
```
# Getting Started
**caixanegra** implements a self-contained flow designer and executor.  
To get started, the only thing you need is to point to your [transient store](https://github.com/sergiorribeiro/caixanegra/wiki/The-Transient-Store) implementation and point out which classes on your codebase should represent units.

First, mount the engine. Add the line below to `routes.rb` file:

```ruby
mount Caixanegra::Engine, at: "/caixanegra", as: :caixanegra
```

Then, let's create a `caixanegra.rb` initializer (or any name you prefer)

```ruby
Caixanegra.setup do |config|
  config.units = [
    Caixanegra::Units::AwesomeUnit,
    Some::Other::Namespace::AnotherAwesomeUnit,
    [Caixanegra::Units::NamespaceOne::SuperUnit, :ns1_super_unit],
    [Caixanegra::Units::NamespaceTwo::SuperUnit, :ns2_super_unit],
  ]
  config.transient_store = GreatTransientStore.new
end
```
While configuring units from your codebase, if provided in the array form, **caixanegra** will use the second array item as the class name. Otherwise it will infer from class.  
**NOTE:** You can't have two classes with the same name as **caixanegra** will use the last one

With the designer configured, you can use `Caixanegra::Manager` to handle the previously stored definition (or an empty one).  
This will give you the UID that **caixanegra** designer will understand, using transient store.  

```ruby
my_flow = somewhere.get_flow # get from your own persistence or transport solution
uid = Caixanegra::Manager.handler(flow_definition: my_flow || {})
```

You can then safely navigate to the designer.

```ruby
link_to "Some flow", "/caixanegra/design/#{@uid}?unit_scope=optional_scope,another_optional_scope", target: :_blank
```

Saved changes will update the flow definition through the transient store, and you must then persist them. You can get the flow definition for any specified **caixanegra** handled UID, given that the transient store is able to correctly sort them out:

```ruby
updated_flow = Caixanegra::Manager.get(my_uid)
persist_flow(updated_flow) # your own persistence or transport solution. It's a JSON
```

Please, refer to [the wiki](https://github.com/sergiorribeiro/caixanegra/wiki) to get to know more about [units](https://github.com/sergiorribeiro/caixanegra/wiki/Anatomy-of-a-unit).

# License
**caixanegra** is available as open source under the terms of the [MIT License](https://opensource.org/licenses/MIT).
